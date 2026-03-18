import { prisma } from "../config/db.js";

function resolveYear(inputYear) {
  const parsedYear = Number(inputYear);

  if (!Number.isInteger(parsedYear)) {
    return new Date().getFullYear();
  }

  return parsedYear;
}

const getYearGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = resolveYear(req.query.year);

    const goal = await prisma.readingGoal.findUnique({
      where: {
        userId_year: {
          userId,
          year,
        },
      },
      include: {
        books: {
          orderBy: {
            addedAt: "desc",
          },
          include: {
            book: {
              include: {
                watchlistItemns: {
                  where: { userId },
                  select: {
                    id: true,
                    status: true,
                    rating: true,
                    pagesRead: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!goal) {
      return res.status(200).json({
        status: "Success",
        data: {
          year,
          targetCount: null,
          totalBooks: 0,
          achievedBooks: 0,
          progress: 0,
          items: [],
        },
      });
    }

    const items = goal.books.map((entry) => {
      const shelf = entry.book.watchlistItemns?.[0] ?? null;
      const isRead = shelf?.status === "READ";

      return {
        goalBookId: entry.id,
        addedAt: entry.addedAt,
        completedAt: entry.completedAt,
        isRead,
        shelfItem: shelf,
        book: {
          ...entry.book,
          watchlistItemns: undefined,
        },
      };
    });

    const achievedBooks = items.filter((item) => item.isRead).length;
    const goalDenominator = goal.targetCount && goal.targetCount > 0
      ? goal.targetCount
      : items.length || 1;
    const progress = Number(((achievedBooks / goalDenominator) * 100).toFixed(2));

    return res.status(200).json({
      status: "Success",
      data: {
        goalId: goal.id,
        year: goal.year,
        targetCount: goal.targetCount,
        totalBooks: items.length,
        achievedBooks,
        progress,
        items,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve yearly goals",
      message: error.message,
    });
  }
};

const addBookToYearGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = resolveYear(req.body.year);
    const { bookId } = req.body;

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true },
    });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const goal = await prisma.readingGoal.upsert({
      where: {
        userId_year: {
          userId,
          year,
        },
      },
      create: {
        userId,
        year,
      },
      update: {},
      select: { id: true, year: true },
    });

    const existing = await prisma.readingGoalBook.findUnique({
      where: {
        goalId_bookId: {
          goalId: goal.id,
          bookId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Book already in this year goal" });
    }

    const created = await prisma.readingGoalBook.create({
      data: {
        goalId: goal.id,
        bookId,
      },
      include: {
        book: true,
      },
    });

    return res.status(201).json({
      status: "Success",
      data: {
        year: goal.year,
        item: created,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to add book to yearly goals",
      message: error.message,
    });
  }
};

const removeBookFromYearGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = resolveYear(req.query.year);
    const { bookId } = req.params;

    const goal = await prisma.readingGoal.findUnique({
      where: {
        userId_year: {
          userId,
          year,
        },
      },
      select: { id: true },
    });

    if (!goal) {
      return res.status(404).json({ error: "Year goal not found" });
    }

    const goalBook = await prisma.readingGoalBook.findUnique({
      where: {
        goalId_bookId: {
          goalId: goal.id,
          bookId,
        },
      },
      select: { id: true },
    });

    if (!goalBook) {
      return res.status(404).json({ error: "Book is not part of this year goal" });
    }

    await prisma.readingGoalBook.delete({
      where: { id: goalBook.id },
    });

    return res.status(200).json({
      status: "Success",
      message: "Book removed from year goal",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to remove book from yearly goals",
      message: error.message,
    });
  }
};

const setYearGoalTarget = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = resolveYear(req.body.year);
    const { targetCount } = req.body;

    const updatedGoal = await prisma.readingGoal.upsert({
      where: {
        userId_year: {
          userId,
          year,
        },
      },
      create: {
        userId,
        year,
        targetCount,
      },
      update: {
        targetCount,
      },
    });

    return res.status(200).json({
      status: "Success",
      data: updatedGoal,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update year target",
      message: error.message,
    });
  }
};

export {
  getYearGoal,
  addBookToYearGoal,
  removeBookFromYearGoal,
  setYearGoalTarget,
};
