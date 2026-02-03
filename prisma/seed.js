import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const creatorId = "0e785631-68e7-443e-be03-207ff25dd37f";

const books = [
  {
    title: "The housemade",
    overview:
      "The Housemaid is a 2022 psychological thriller novel by Freida McFadden and published by Bookouture. Set on Long Island, the novel follows a young maid for a wealthy family with dark secrets.",
    releaseYear: 2022,
    genres: ["Suspense", "Fiction"],
    pages: 347,
    coverUrl:
      "https://static.skeelo.com/remote/320/480/100/https://skoob.s3.amazonaws.com/livros/122440915/THE_HOUSEMAID_1713041289122440915SK-V11713041290B.jpg",
    author: "Freida McFadden",
    createdBy: creatorId,
    publisher: "Grand Central Publishing",
  },
  {
    title: "Dear Debbie",
    overview:
      "Debbie Mullen is losing it. For years, she has compiled all of her best advice into her column, Dear Debbie, where the wives of New England come for sympathy and neighborly advice. Through her work, Debbie has heard from countless women who are ignored, belittled, or even abused by their husbands. And Debbie does her best to guide them in the right direction. Or at least, she did. These days, Debbie’s life seems to be spiraling out of control. She just lost her job. Something strange is happening with her teenage daughters. And her husband is keeping secrets, according to the tracking app she installed on his phone. Now, Debbie’s done being the bigger person. She’s done being reasonable and practical. It’s time to take her own advice.And now it’s time for payback against all the people in her life who deserve it the most.",
    releaseYear: 2026,
    genres: ["Suspense", "Fiction"],
    pages: 303,
    coverUrl:
      "https://static.skeelo.com/remote/320/480/100/https://skoob.s3.amazonaws.com/livros/122590865/DEAR_DEBBIE_1753475193122590865SK-V11753475199B.jpg",
    author: "Freida McFadden",
    createdBy: creatorId,
    publisher: "Hollywood Upstairs Press",
  },

  {
    title: "The Crash",
    overview:
      "A brand new psychological thriller from #1 New York Times bestselling author Freida McFadden! The nightmare she's running from is nothing compared to where she's headed. Tegan is eight months pregnant, alone, and desperately wants to put her crumbling life in the rearview mirror. So she hits the road, planning to stay with her brother until she can figure out her next move. But she doesn't realize she's heading straight into a blizzard. She never arrives at her destination. Stranded in rural Maine with a dead car and broken ankle, Tegan worries she's made a terrible mistake. Then a miracle occurs: she is rescued by a couple who offers her a room in their warm cabin until the snow clears. But something isn't right. Tegan believed she was waiting out the storm, but as time ticks by, she comes to realize she is in grave danger. This safe haven isn't what she thought it was, and staying here may have been her most deadly mistake yet. And now she must do whatever it takes to save herself&#8213;and her unborn child.",
    releaseYear: 2025,
    genres: ["Suspense", "Fiction"],
    pages: 338,
    coverUrl:
      "https://static.skeelo.com/remote/320/480/100/https://skoob.s3.amazonaws.com/livros/122501504/THE_CRASH_1726381268122501504SK-V11726381268B.jpg",
    author: "Freida McFadden",
    createdBy: creatorId,
    publisher: "Hollywood Upstairs Press",
  },
  {
    title: "The Boyfriend",
    overview:
      "Sydney Shaw, like every single woman in New York, has terrible luck with dating. She’s seen it all: men who lie in their dating profile, men who stick her with the dinner bill, and worst of all, men who can't shut up about their mothers. But finally, she hits the jackpot. Her new boyfriend is utterly perfect. He's charming, handsome, and works as a doctor at a local hospital. Sydney is swept off her feet. Then the brutal murder of a young woman―the latest in a string of deaths across the coast―confounds police. The primary suspect? A mystery man who dates his victims before he kills them. Sydney should feel safe. After all, she is dating the guy of her dreams. But she can’t shake her own suspicions that the perfect man may not be as perfect as he seems. Because someone is watching her every move, and if she doesn’t get to the truth, she’ll be the killer’s next victim... A dark story about obsession and the things we’ll do for love, #1 New York Times bestselling author Freida McFadden proves that crimes of passion are often the bloodiest…",
    releaseYear: 2024,
    genres: ["Suspense", "Fiction"],
    pages: 368,
    coverUrl:
      "https://static.skeelo.com/remote/320/480/100/https://skoob.s3.amazonaws.com/livros/122431100/THE_BOYFRIEND_1710427771122431100SK-V11710427772B.jpg",
    author: "Freida McFadden",
    createdBy: creatorId,
    publisher: "Poisoned Pen Press",
  },

  {
    title: "The Intruder",
    overview:
      "There’s someone at your front door – should you let them in? Find out in a riveting new thriller from global sensation and #1 Sunday Times bestselling author of The Housemaid, Freida McFadden! Who knows what the storm will blow in… Casey''s cabin in the wilderness is not built for a hurricane. Her roof shakes, the lights flicker, and the tree outside her front door sways ominously in the wind. But she''s a lot more worried about the girl she discovers lurking outside her kitchen window. She’s young. She’s alone. And she’s covered in blood. The girl won''t explain where she came from, or loosen her grip on the knife in her right hand. And when Casey makes a disturbing discovery in the middle of the night, things take a turn for the worse. The girl has a dark secret. One she’ll kill to keep. And if Casey gets too close to the truth, she may not live to see the morning.",
    releaseYear: 2025,
    genres: ["Suspense", "Fiction"],
    pages: 335,
    coverUrl:
      "https://static.skeelo.com/remote/320/480/100/https://skoob.s3.amazonaws.com/livros/122595676/THE_INTRUDER_1755281432122595676SK-V11755281432B.jpg",
    author: "Freida McFadden",
    createdBy: creatorId,
    publisher: "Poisoned Pen Press",
  },
];

const main = async () => {
  console.log("Seeding books...");

  for (const book of books) {
    await prisma.book.create({
      data: book,
    });
    console.log(`Created book: ${book.title}`);
  }

  console.log("Seeding completed");
};

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
