import { prisma } from "../config/db.js";
import {
  fetchGoogleBookByIsbn,
  getDisplayRate,
} from "../services/googleBookService.js";

function normalizeIsbn(input = "") {
  return String(input)
    .replace(/[^0-9Xx]/g, "")
    .toUpperCase();
}

function extractYear(publishedDate) {
  const year = Number(String(publishedDate || "").slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function extractIsbnArray(industryIdentifiers = [], fallbackIsbn = null) {
  const isbn13 = industryIdentifiers.find(
    (x) => x.type === "ISBN_13",
  )?.identifier;
  const isbn10 = industryIdentifiers.find(
    (x) => x.type === "ISBN_10",
  )?.identifier;
  const list = [isbn10, isbn13, fallbackIsbn]
    .filter(Boolean)
    .map(normalizeIsbn);

  return [...new Set(list)];
}

const getBook = async (req, res) => {
  const book = await prisma.book.findUnique({ where: { id: req.params.id } });
  if (!book) return res.status(404).json({ error: "Livro não encontrado" });

  const agg = await prisma.shelfItem.aggregate({
    where: { bookId: book.id, rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const appAvg = agg._avg.rating ?? null;
  const appCount = agg._count.rating ?? 0;

  const displayRating =
    appCount >= 3 ? appAvg : typeof book.rate === "number" ? book.rate : appAvg;

  return res.status(200).json({
    data: {
      ...book,
      displayRating,
      appRatingAvg: appAvg,
      appRatingCount: appCount,
    },
  });
};

const previewBookByIsbn = async (req, res) => {
  try {
    const isbn = normalizeIsbn(req.params.isbn);

    const item = await fetchGoogleBookByIsbn(isbn);
    if (!item) return res.status(404).json({ error: "Livro não encontrado" });

    const volumeInfo = item.volumeInfo ?? {};
    if (Object.keys(volumeInfo).length === 0) {
      return res
        .status(502)
        .json({ error: "Google Books retornou volumeInfo vazio" });
    }

    const isbns = extractIsbnArray(volumeInfo.industryIdentifiers, isbn);

    const preview = {
      title: volumeInfo.title ?? "Sem título",
      overview: volumeInfo.description ?? null,
      releaseYear: extractYear(volumeInfo.publishedDate) ?? 0,
      genres: volumeInfo.categories ?? [],
      pages: volumeInfo.pageCount ?? 0, // pode vir 0 mesmo
      coverUrl:
        volumeInfo.imageLinks?.thumbnail ??
        volumeInfo.imageLinks?.smallThumbnail ??
        null,
      author: volumeInfo.authors?.length
        ? volumeInfo.authors.join(", ")
        : "Autor desconhecido",
      publisher: volumeInfo.publisher ?? "Editora desconhecida",
      rate: volumeInfo.averageRating ?? null,

      ISBN: isbns,

      subtitle: volumeInfo.subtitle ?? null,
      language: volumeInfo.language ?? null,
      publishedDate: volumeInfo.publishedDate ?? null,
      ratingsCount: volumeInfo.ratingsCount ?? null,
      googleVolumeId: item.id ?? null,
      previewLink: volumeInfo.previewLink ?? null,
      infoLink: volumeInfo.infoLink ?? null,
      raw: volumeInfo,
      source: "googlebooks",
    };

    return res.json({ data: preview });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar preview do livro" });
  }
};

const addBookByIsbn = async (req, res) => {
  try {
    const isbn = normalizeIsbn(req.params.isbn);

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Não autenticado" });

    const inputPages = Number(req.body?.pages);
    if (!Number.isFinite(inputPages) || inputPages <= 0) {
      return res.status(400).json({
        error: "pages é obrigatório e deve ser um número > 0",
      });
    }

    const item = await fetchGoogleBookByIsbn(isbn);
    if (!item) return res.status(404).json({ error: "Livro não encontrado" });

    const volumeInfo = item.volumeInfo ?? {};
    if (Object.keys(volumeInfo).length === 0) {
      return res
        .status(502)
        .json({ error: "Google Books retornou volumeInfo vazio" });
    }

    const isbns = extractIsbnArray(volumeInfo.industryIdentifiers, isbn);

    // Checa se já existe por qualquer ISBN dentro do array
    // Prisma para String[] (Postgres): has / hasSome
    const existing = await prisma.book.findFirst({
      where: {
        ISBN: {
          hasSome: isbns, // se qualquer um bater, já existe
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        error: "Livro já cadastrado",
        data: existing,
      });
    }

    const title = volumeInfo.title ?? "Sem título";
    const releaseYear = extractYear(volumeInfo.publishedDate) ?? 0;
    const author = volumeInfo.authors?.length
      ? volumeInfo.authors.join(", ")
      : "Autor desconhecido";
    const publisher = volumeInfo.publisher ?? "Editora desconhecida";

    const created = await prisma.book.create({
      data: {
        title,
        overview: volumeInfo.description ?? null,
        releaseYear,
        genres: volumeInfo.categories ?? [],
        pages: inputPages,
        coverUrl:
          volumeInfo.imageLinks?.thumbnail ??
          volumeInfo.imageLinks?.smallThumbnail ??
          null,
        author,
        createdBy: userId,
        publisher,
        rate: volumeInfo.averageRating ?? null,
        ISBN: isbns,
        subtitle: volumeInfo.subtitle ?? null,
        language: volumeInfo.language ?? null,
        publishedDate: volumeInfo.publishedDate ?? null,
        ratingsCount: volumeInfo.ratingsCount ?? null,
        googleVolumeId: item.id ?? null,
        previewLink: volumeInfo.previewLink ?? null,
        infoLink: volumeInfo.infoLink ?? null,
        raw: volumeInfo,
        source: "googlebooks",
      },
    });
    return res.status(201).json({ data: created, cached: false });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: `Erro ao buscar/salvar livro: ${err}` });
  }
};

const updateBookByIsbn = async (req, res) => {
  try {
    const isbnParam = normalizeIsbn(req.params.isbn);

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Não autenticado" });

    // acha o livro pelo ISBN dentro do array
    const existing = await prisma.book.findFirst({
      where: {
        ISBN: { has: isbnParam },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Livro não encontrado" });
    }

    // monta updateData só com o que veio no body
    const {
      title,
      overview,
      releaseYear,
      genres,
      pages,
      coverUrl,
      author,
      publisher,
      rate,

      subtitle,
      language,
      publishedDate,
      ratingsCount,
      previewLink,
      infoLink,
      raw,
      source,

      ISBN,
    } = req.body ?? {};

    const updateData = {};

    if (title !== undefined) updateData.title = String(title);
    if (overview !== undefined)
      updateData.overview = overview === null ? null : String(overview);

    if (releaseYear !== undefined) {
      const year = Number(releaseYear);
      if (!Number.isFinite(year) || year < 0) {
        return res.status(400).json({ error: "releaseYear inválido" });
      }
      updateData.releaseYear = year;
    }

    if (genres !== undefined) {
      if (!Array.isArray(genres)) {
        return res
          .status(400)
          .json({ error: "genres deve ser um array de strings" });
      }
      updateData.genres = genres.map(String);
    }

    if (pages !== undefined) {
      const p = Number(pages);
      if (!Number.isFinite(p) || p <= 0) {
        return res.status(400).json({ error: "pages deve ser um número > 0" });
      }
      updateData.pages = p;
    }

    if (coverUrl !== undefined)
      updateData.coverUrl = coverUrl === null ? null : String(coverUrl);
    if (author !== undefined) updateData.author = String(author);
    if (publisher !== undefined) updateData.publisher = String(publisher);

    if (rate !== undefined) {
      const r = rate === null ? null : Number(rate);
      if (r !== null && (!Number.isFinite(r) || r < 0)) {
        return res.status(400).json({ error: "rate inválido" });
      }
      updateData.rate = r;
    }

    // extras (opcionais)
    if (subtitle !== undefined)
      updateData.subtitle = subtitle === null ? null : String(subtitle);
    if (language !== undefined)
      updateData.language = language === null ? null : String(language);
    if (publishedDate !== undefined)
      updateData.publishedDate =
        publishedDate === null ? null : String(publishedDate);
    if (ratingsCount !== undefined) {
      const n = ratingsCount === null ? null : Number(ratingsCount);
      if (n !== null && (!Number.isFinite(n) || n < 0)) {
        return res.status(400).json({ error: "ratingsCount inválido" });
      }
      updateData.ratingsCount = n;
    }
    if (previewLink !== undefined)
      updateData.previewLink =
        previewLink === null ? null : String(previewLink);
    if (infoLink !== undefined)
      updateData.infoLink = infoLink === null ? null : String(infoLink);
    if (raw !== undefined) updateData.raw = raw; // Json
    if (source !== undefined)
      updateData.source = source === null ? null : String(source);

    // Atualizar ISBNs (se vier)
    if (ISBN !== undefined) {
      const nextIsbns = normalizeIsbnArray(ISBN);

      if (nextIsbns.length === 0) {
        return res
          .status(400)
          .json({ error: "ISBN deve conter ao menos 1 valor válido" });
      }

      // evita conflito com outro livro já cadastrado usando algum desses ISBNs
      const conflict = await prisma.book.findFirst({
        where: {
          id: { not: existing.id },
          ISBN: { hasSome: nextIsbns },
        },
      });

      if (conflict) {
        return res.status(409).json({
          error: "Já existe outro livro com um desses ISBNs",
          conflictBookId: conflict.id,
        });
      }

      updateData.ISBN = nextIsbns;
    }

    // se não veio nada pra atualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }

    // Update sempre por id
    const updated = await prisma.book.update({
      where: { id: existing.id },
      data: updateData,
    });

    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar livro" });
  }
};

const removeBookByIsbn = async (req, res) => {
  const isbn = normalizeIsbn(req.params.isbn);

  const existing = await prisma.book.findFirst({
    where: {
      ISBN: {
        has: isbn,
      },
    },
  });

  if (!existing) {
    return res.status(409).json({
      error: "Livro não encontrado",
      data: existing,
    });
  }

  await prisma.book.delete({
    where: {
      id: existing.id,
    },
  });

  res.status(200).json({
    status: "Success",
    message: "Book deleted",
  });
};

export {
  getBook,
  addBookByIsbn,
  previewBookByIsbn,
  removeBookByIsbn,
  updateBookByIsbn,
};
