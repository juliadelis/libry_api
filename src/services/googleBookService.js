import "dotenv/config";

const fetchGoogleBookByIsbn = async (isbn) => {
  const key = process.env.GOOGLE_BOOKS_API_KEY;

  if (!key) {
    throw new Error("GOOGLE_BOOKS_API_KEY não configurada no .env");
  }

  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", `isbn:${isbn}`);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Books error: ${res.status} - ${text}`);
  }

  const data = await res.json();

  if (!data.items?.length) return null;

  return data.items[0];
};

function getDisplayRate(book) {
  if (!book) return null;

  // prioridade: nota do seu app
  if (book.appRatingCount >= 3) {
    return round(book.appRatingAvg);
  }

  // fallback: Google Books
  if (typeof book.rate === "number") {
    return round(book.rate);
  }

  // se só tiver 1 ou 2 notas no app
  if (book.appRatingCount > 0) {
    return round(book.appRatingAvg);
  }

  return null;
}

export { fetchGoogleBookByIsbn, getDisplayRate };
