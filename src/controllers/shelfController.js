import { prisma } from "../config/db.js";

const viewShelf = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all shelf items for the user with complete book information
    const shelfItems = await prisma.shelfItem.findMany({
      where: { userId },
      include: {
        book: true, // Include all book details
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (shelfItems.length === 0) {
      return res.status(200).json({
        status: "Success",
        data: {
          userId,
          shelfItems: [],
          totalBooks: 0,
        },
      });
    }

    res.status(200).json({
      status: "Success",
      data: {
        userId,
        shelfItems,
        totalBooks: shelfItems.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve shelf",
      message: error.message,
    });
  }
};

const addToShelf = async (req, res) => {
  const { bookId, status, rating, notes } = req.body;

  // Verify book exists
  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });

  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }

  const existingInShelf = await prisma.shelfItem.findUnique({
    where: {
      userId_bookId: {
        userId: req.user.id,
        bookId: bookId,
      },
    },
  });

  if (existingInShelf) {
    return res.status(400).json({ error: "Book already in the shelf" });
  }

  const shelfItem = await prisma.shelfItem.create({
    data: {
      userId: req.user.id,
      bookId,
      status: status || "PLANNED",
      rating,
      notes,
    },
  });

  res.status(201).json({
    status: "Success",
    data: { shelfItem },
  });
};

const updateFromShelf = async (req, res) => {
  const { status, rating, notes, pagesRead } = req.body;

  // Find shelf item and verify ownership
  const shelfItem = await prisma.shelfItem.findUnique({
    where: { id: req.params.id },
  });

  if (!shelfItem) {
    res.status(404).json({
      error: "Shelf item not found",
    });
  }

  //Ensure only owner can delete
  if (shelfItem.userId !== req.user.id) {
    res.status(403).json({
      error: "Not allowed to update this shelf item",
    });
  }

  const updateData = {};

  if (status !== undefined) updateData.status = status.toUpperCase();
  if (rating !== undefined) updateData.rating = rating;
  if (notes !== undefined) updateData.notes = notes;
  if (pagesRead !== undefined) updateData.pagesRead = pagesRead;

  await prisma.shelfItem.update({
    where: { id: req.params.id, data: updateData },
  });

  res.status(200).json({
    status: "Success",
    message: "Book updated from shelf",
  });
};

const setShelfItemRating = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Não autenticado" });

    const shelfItemId = req.params.shelfItemId;
    const newRating = req.body?.rating;

    // valida rating (ex: 1..5)
    if (newRating !== null && newRating !== undefined) {
      const r = Number(newRating);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        return res
          .status(400)
          .json({ error: "rating deve ser inteiro entre 1 e 5, ou null" });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      //  pega o ShelfItem
      const shelfItem = await tx.shelfItem.findFirst({
        where: { id: shelfItemId, userId },
        select: { id: true, rating: true, bookId: true },
      });

      if (!shelfItem) throw new Error("ShelfItem não encontrado");

      const oldRating = shelfItem.rating; // pode ser null
      const nextRating = newRating === null ? null : Number(newRating);

      //  atualiza a rating no ShelfItem
      const updatedShelfItem = await tx.shelfItem.update({
        where: { id: shelfItemId },
        data: { rating: nextRating },
      });

      //  calcula deltas pro agregado no Book
      let sumDelta = 0;
      let countDelta = 0;

      const had = typeof oldRating === "number";
      const has = typeof nextRating === "number";

      if (!had && has) {
        // primeira nota
        sumDelta = nextRating;
        countDelta = 1;
      } else if (had && has) {
        // mudança de nota
        sumDelta = nextRating - oldRating;
        countDelta = 0;
      } else if (had && !has) {
        // removeu nota
        sumDelta = -oldRating;
        countDelta = -1;
      } else {
        // null -> null (sem efeito)
        sumDelta = 0;
        countDelta = 0;
      }

      // 4) atualiza agregados no Book
      // atualiza sum/count e depois recomputa avg
      if (sumDelta !== 0 || countDelta !== 0) {
        const updatedBook = await tx.book.update({
          where: { id: shelfItem.bookId },
          data: {
            appRatingSum: { increment: sumDelta },
            appRatingCount: { increment: countDelta },
          },
          select: { id: true, appRatingSum: true, appRatingCount: true },
        });

        const avg =
          updatedBook.appRatingCount > 0
            ? updatedBook.appRatingSum / updatedBook.appRatingCount
            : 0;

        await tx.book.update({
          where: { id: shelfItem.bookId },
          data: { appRatingAvg: avg },
        });
      }

      return updatedShelfItem;
    });

    return res.json({ data: result });
  } catch (err) {
    console.error(err);
    const msg =
      err?.message === "ShelfItem não encontrado"
        ? err.message
        : "Erro ao salvar rating";
    return res.status(500).json({ error: msg });
  }
};

const removeFromShelf = async (req, res) => {
  // Find shelf item and verify ownership
  const shelfItem = await prisma.shelfItem.findUnique({
    where: { id: req.params.id },
  });

  if (!shelfItem) {
    res.status(404).json({
      error: "Shelf item not found",
    });
  }

  //Ensure only owner can delete
  if (shelfItem.userId !== req.user.id) {
    res.status(403).json({
      error: "Not allowed to update this shelf item",
    });
  }

  await prisma.shelfItem.delete({
    where: { id: req.params.id },
  });

  res.status(200).json({
    status: "Success",
    message: "Book removed from shelf",
  });
};

export {
  addToShelf,
  removeFromShelf,
  updateFromShelf,
  setShelfItemRating,
  viewShelf,
};
