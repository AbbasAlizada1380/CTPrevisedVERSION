import { Order, Digital, Offset } from "./Models/Orders.js"; // adjust path
import sequelize from "./dbconnection.js"; // adjust path

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ✅ Persian first & last names
const firstNames = [
  "احمد",
  "محمد",
  "علی",
  "امید",
  "حسین",
  "فرید",
  "رحیم",
  "حبیب",
  "ناصر",
  "سامی",
  "یاسین",
  "زبیر",
  "بلال",
  "سجاد",
  "مرتضی",
  "جاوید",
  "کریم",
  "مهدی",
  "رضا",
  "حسیب",
  "وحید",
  "عبدالله",
  "شفیق",
  "حمید",
  "بصیر",
  "فاضل",
  "سلیمان",
  "جواد",
  "احسان",
  "رفیع",
  "مسعود",
  "خالد",
];

const lastNames = [
  "احمدی",
  "علیزاده",
  "حسینی",
  "کریمی",
  "رحمانی",
  "سلطانی",
  "نوری",
  "عزیزی",
  "حسینی",
  "فاروقی",
  "خطیبی",
  "یوسفی",
  "قدیری",
  "صفدری",
  "سادات",
  "نظری",
  "احمدزای",
  "فهیمی",
  "رضایی",
  "حبیبی",
  "جعفری",
  "پپل",
  "سنگری",
  "موسوی",
  "کاظمی",
  "شیری",
  "زدران",
  "لطیفی",
  "امینی",
  "حقانی",
];

const generatePhone = () => `07${random(0, 9)}${random(1000000, 9999999)}`;

const generateOrderData = () => {
  const first = firstNames[random(0, firstNames.length - 1)];
  const last = lastNames[random(0, lastNames.length - 1)];
  const customer = { name: `${first} ${last}`, phone_number: generatePhone() };

  // Generate digital items in Persian
  const digitalCount = random(1, 3);
  const digital = Array.from({ length: digitalCount }).map((_, i) => {
    const price_per_unit = random(100, 500);
    const quantity = random(1, 5);
    return {
      name: `دیجیتال ${i + 1}`, // Persian title
      quantity,
      price_per_unit,
      money: price_per_unit * quantity,
      height: random(1, 10),
      area: random(1, 20),
      weight: random(1, 5),
    };
  });

  // Generate offset items in Persian
  const offsetCount = random(1, 2);
  const offset = Array.from({ length: offsetCount }).map((_, i) => {
    const price_per_unit = random(200, 600);
    const quantity = random(1, 3);
    return {
      name: `آفست ${i + 1}`, // Persian title
      quantity,
      price_per_unit,
      money: price_per_unit * quantity,
    };
  });

  const total_money_digital = digital.reduce((sum, d) => sum + d.money, 0);
  const total_money_Offset = offset.reduce((sum, o) => sum + o.money, 0);
  const total = total_money_digital + total_money_Offset;
  const digitalId = total_money_digital + total_money_Offset;
  const recip = random(0, total);
  const remained = total - recip;

  return {
    customer,
    digital,
    offset,
    total_money_digital,
    total_money_Offset,
    total,
    digitalId,
    recip,
    remained,
  };
};

// Seed function
const seedOrders = async () => {
  try {
    await sequelize.sync({ force: false }); // true to drop tables first

    for (let i = 1; i <= 100; i++) {
      const {
        customer,
        digital,
        offset,
        total_money_digital,
        total_money_Offset,
        total,
        digitalId,
        recip,
        remained,
      } = generateOrderData();

      // Create order
      const order = await Order.create({
        customer,
        total_money_digital,
        total_money_Offset,
        total,
        digitalId,
        recip,
        remained,

        isDelivered: Math.random() > 0.5,
      });

      // Create associated digital items
      for (let d of digital) {
        await Digital.create({ ...d, orderId: order.id });
      }

      // Create associated offset items
      for (let o of offset) {
        await Offset.create({ ...o, orderId: order.id });
      }

      console.log(`✅ Created order ${i}: ${customer.name}`);
    }

    console.log("🌟 Done creating 100 realistic orders in Persian!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding orders:", err);
    process.exit(1);
  }
};

seedOrders();
