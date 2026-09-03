// English sentence pack.
// text : sentence   level : 1 = easy, 2 = normal, 3 = hard   tag : theme
const EN_SENTENCES = [
  // ---- daily -----------------------------------------------------------
  { text: 'Good morning, everyone.', level: 1, tag: 'daily' },
  { text: 'It is sunny today.', level: 1, tag: 'daily' },
  { text: 'I like cats.', level: 1, tag: 'daily' },
  { text: 'See you tomorrow.', level: 1, tag: 'daily' },
  { text: 'Where are my keys?', level: 1, tag: 'daily' },
  { text: 'I usually wake up at seven and make coffee before work.', level: 2, tag: 'daily' },
  { text: 'The park near my house is beautiful in spring.', level: 2, tag: 'daily' },
  { text: 'Please turn off the lights when you leave the room.', level: 2, tag: 'daily' },
  { text: 'My neighbor moved in last week, so I brought them cookies.', level: 2, tag: 'daily' },
  { text: 'I try to clean my apartment every Sunday afternoon.', level: 2, tag: 'daily' },
  { text: 'Small habits, repeated every day, eventually turn into big changes.', level: 3, tag: 'daily' },
  { text: 'On nights when I cannot sleep, a cup of warm milk helps me relax.', level: 3, tag: 'daily' },
  { text: 'Spending time with family matters more to me than anything else.', level: 3, tag: 'daily' },
  { text: 'Before I forget, I should write down the shopping list for tomorrow.', level: 3, tag: 'daily' },
  { text: 'Instead of scrolling on my phone, I went outside for a short walk.', level: 3, tag: 'daily' },

  // ---- travel ----------------------------------------------------------
  { text: 'Where is the station?', level: 1, tag: 'travel' },
  { text: 'Two tickets, please.', level: 1, tag: 'travel' },
  { text: 'Can I take a photo here?', level: 1, tag: 'travel' },
  { text: 'The next stop is mine.', level: 1, tag: 'travel' },
  { text: 'How much is a room for one night?', level: 1, tag: 'travel' },
  { text: 'We rented a car and drove along the coast for three days.', level: 2, tag: 'travel' },
  { text: 'The transfer at the airport took almost three hours.', level: 2, tag: 'travel' },
  { text: 'I left the restaurant early to catch the last train.', level: 2, tag: 'travel' },
  { text: 'The sea in Okinawa was an unbelievable shade of blue.', level: 2, tag: 'travel' },
  { text: 'Is there a cheap hotel near the old town?', level: 2, tag: 'travel' },
  { text: 'Trips without too much planning often lead to the most unexpected discoveries.', level: 3, tag: 'travel' },
  { text: 'I still keep in touch with the people I met on my first trip abroad.', level: 3, tag: 'travel' },
  { text: 'Before traveling overseas, remember to exchange money and arrange insurance.', level: 3, tag: 'travel' },
  { text: 'Asking locals for their favorite restaurants is the best part of any journey.', level: 3, tag: 'travel' },
  { text: 'Even without perfect language skills, the will to communicate keeps a journey going.', level: 3, tag: 'travel' },


  // ---- food ------------------------------------------------------------
  { text: 'One coffee, please.', level: 1, tag: 'food' },
  { text: 'This cake is too sweet.', level: 1, tag: 'food' },
  { text: 'What is this dish called?', level: 1, tag: 'food' },
  { text: 'Dinner tonight is curry.', level: 1, tag: 'food' },
  { text: 'Another glass of water, please.', level: 1, tag: 'food' },
  { text: 'The croissants at the bakery by the station are famous.', level: 2, tag: 'food' },
  { text: 'I tried making dumplings by hand for the first time.', level: 2, tag: 'food' },
  { text: 'Cold noodles are the perfect dish for a hot summer day.', level: 2, tag: 'food' },
  { text: 'Grilled fish and a bowl of rice are enough for me.', level: 2, tag: 'food' },
  { text: 'A bowl of hot soup warms you up on a cold evening.', level: 2, tag: 'food' },
  { text: 'Using seasonal vegetables makes even the simplest dish taste better.', level: 3, tag: 'food' },
  { text: 'The smell of freshly baked bread pulled me straight into the shop.', level: 3, tag: 'food' },
  { text: 'Gathering around a hot pot with family is one of the joys of winter.', level: 3, tag: 'food' },
  { text: 'I try to cook at least one vegetable-heavy dish every single day.', level: 3, tag: 'food' },
  { text: 'Not leaving food on your plate is a way of thanking the person who cooked it.', level: 3, tag: 'food' },

  // ---- work: everyday office phrases and business email language --------------
  { text: 'Good morning. I hope you had a nice weekend.', level: 1, tag: 'work' },
  { text: 'Thank you for your hard work.', level: 1, tag: 'work' },
  { text: 'Thank you for your continued support.', level: 1, tag: 'work' },
  { text: 'Understood, will do.', level: 1, tag: 'work' },
  { text: 'Please hold on a moment.', level: 1, tag: 'work' },
  { text: 'I will check and get back to you.', level: 1, tag: 'work' },
  { text: 'I am away from my desk.', level: 1, tag: 'work' },
  { text: 'I am heading out. Have a good evening.', level: 1, tag: 'work' },
  { text: 'The meeting starts at ten.', level: 1, tag: 'work' },
  { text: 'Please send me the file.', level: 1, tag: 'work' },
  { text: 'Thank you for taking the time to meet with us today.', level: 2, tag: 'work' },
  { text: 'Please find the document attached.', level: 2, tag: 'work' },
  { text: 'I look forward to your reply.', level: 2, tag: 'work' },
  { text: 'Could you reply by tomorrow if possible?', level: 2, tag: 'work' },
  { text: 'I will confirm with the person in charge and get back to you.', level: 2, tag: 'work' },
  { text: 'Sorry for the trouble, and thank you in advance.', level: 2, tag: 'work' },
  { text: 'Could you book the meeting room for me?', level: 2, tag: 'work' },
  { text: 'I am working from home today, so please message me on chat.', level: 2, tag: 'work' },
  { text: 'I am not feeling well, so I will take the day off.', level: 2, tag: 'work' },
  { text: 'Here are the minutes from today\'s meeting.', level: 2, tag: 'work' },
  { text: 'I will be out of the office tomorrow morning.', level: 2, tag: 'work' },
  { text: 'Just a quick update for now.', level: 2, tag: 'work' },
  { text: 'I apologize for the inconvenience, but could you take a look when you have a moment?', level: 3, tag: 'work' },
  { text: 'Could we find a time to discuss the delivery schedule?', level: 3, tag: 'work' },
  { text: 'I have corrected the points you raised and attached the revised version.', level: 3, tag: 'work' },
  { text: 'There was an error in my previous email, so I am sending a corrected version.', level: 3, tag: 'work' },
  { text: 'If today is not possible, tomorrow morning is fine as well.', level: 3, tag: 'work' },
  { text: 'Thank you for attending despite your busy schedule.', level: 3, tag: 'work' },
  { text: 'The attachment did not open on my end. Could you resend it?', level: 3, tag: 'work' },
  { text: 'Thank you for your time today, and I look forward to working with you.', level: 3, tag: 'work' },
];

// Curated paragraphs for paragraph mode.
const EN_PARAGRAPHS = [
  { text: 'Today is Sunday. I got up late and made a cup of coffee. In the afternoon I will walk in the park with a friend.', level: 1, tag: 'daily' },
  { text: 'Half a year after moving, I have finally gotten used to the new town. The shopkeepers on the main street are friendly, and we chat a little every time I go shopping. Even in an unfamiliar place, life becomes rich when you have people to talk to.', level: 3, tag: 'daily' },
  { text: 'The second day of my trip to Kyoto was the best. I visited the temple early in the morning, so it was quiet and almost empty. For lunch I had tofu, and in the evening I walked along the river.', level: 2, tag: 'travel' },
  { text: 'On my first solo trip abroad, the language barrier confused me many times. Still, whenever I pointed at a map and asked for directions, strangers kindly showed me the way. I learned that the will to communicate matters more than perfect grammar.', level: 3, tag: 'travel' },
  { text: 'Last weekend I made curry from scratch for the first time. Frying the onions slowly took a while, but it made the sauce sweet and rich. My family loved it, so I want to make it again.', level: 2, tag: 'food' },
  { text: 'Home cooking is full of small wisdom about using seasonal ingredients. Tasting what is in season lets you feel the changing of the year, from spring greens to winter root vegetables. Even on busy days, adding one seasonal ingredient makes the table a little richer.', level: 3, tag: 'food' },

  { text: 'Hello, this is Tanaka. I am sending the materials for tomorrow\'s meeting. Please take a look when you have a moment.', level: 1, tag: 'work' },
  { text: 'Thank you for your continued support, and for your time at our meeting the other day. I have put together materials on the matter we discussed and attached them. I would appreciate your review, and I look forward to working with you.', level: 3, tag: 'work' },
];

// Warm-up drill items: key rows and short words.
const EN_DRILLS = [
  { text: 'asdf jkl' }, { text: 'qwer uiop' }, { text: 'zxcv bnm' }, { text: 'the quick brown fox' }, { text: 'jumps over the lazy dog' },
  { text: 'cat' }, { text: 'dog' }, { text: 'school' }, { text: 'friend' }, { text: 'weather' }, { text: 'study' }, { text: 'music' },
  { text: 'travel' }, { text: 'homework' }, { text: 'ticket' }, { text: 'library' }, { text: 'newspaper' }, { text: 'coffee' }, { text: 'thank you' }, { text: 'hello' },
];
