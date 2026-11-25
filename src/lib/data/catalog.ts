import type { Category, Coupon, Product, ProductPalette, Review, SpriteId, StoreSettings, Variant, CategoryId, PackType } from "./types";

/**
 * Seed catalogue. Copy follows the client's design document; prices and stock
 * are placeholders the admin edits. Mirrors supabase/seed.sql.
 */

export const WEIGHTS = [100, 200, 300, 500, 1000] as const;
const SIZE_FACTOR: Record<number, number> = { 100: 1, 200: 0.95, 300: 0.92, 500: 0.88, 1000: 0.84 };

export const categories: Category[] = [
  { id: "podis", name: "Podis", blurb: "Comforting podis for idli, dosa and hot rice.", sort: 1 },
  { id: "rice-mixes", name: "Rice Mixes", blurb: "Spoon-and-stir mixes for quick, homely meals.", sort: 2 },
  { id: "health-mixes", name: "Health Mixes & Malts", blurb: "Wholesome traditional mixes and malts for the whole family.", sort: 3 },
  { id: "wellness", name: "Wellness", blurb: "Everyday nutrition blends made with plant-based goodness.", sort: 4 },
];

interface Seed {
  slug: string;
  name: string;
  altName?: string;
  categoryId: CategoryId;
  tagline: string;
  summary: string;
  description: string;
  keyIngredients: string[];
  howToUse: string;
  packType: PackType;
  palette: ProductPalette;
  sprites: SpriteId[];
  featured: boolean;
  /** Placeholder price per 100 g in rupees */
  p100: number;
  /** Stock per weight (100, 200, 300, 500, 1000) */
  stock: [number, number, number, number, number];
}

const PODI_USE = "Mix two spoons of podi with gingelly oil or ghee. Enjoy with idli, dosa or uthappam - or stir through hot rice.";
const RICE_MIX_USE = "Mix 2–3 spoons with a cup of hot rice and a little ghee or oil. Lovely with upma, idli and dosa too.";

const seeds: Seed[] = [
  {
    slug: "idli-podi",
    name: "Idli Podi",
    categoryId: "podis",
    tagline: "A Taste of Home",
    summary: "Every spoonful brings back the warmth of homemade food. A traditional taste that makes even a simple meal special.",
    description:
      "This is the podi that sits on every South Indian breakfast table. Lentils and red chillies are roasted until fragrant, then ground with curry leaves to a coarse, homely texture. Stir it into a little gingelly oil or ghee, and soft idlis and crisp dosas taste like a Sunday morning at home.",
    keyIngredients: ["Lentils", "Red chillies", "Curry leaves"],
    howToUse: PODI_USE,
    packType: "pouch",
    palette: { bg: "#F1E4C3", ink: "#1E2A1F", accent: "#C8641E", deep: "#1E4D2B" },
    sprites: ["uradDal", "chilli", "curryLeaf", "chanaDal", "mustard"],
    featured: true,
    p100: 70,
    stock: [48, 36, 22, 30, 14],
  },
  {
    slug: "garlic-idli-podi",
    name: "Garlic Idli Podi",
    categoryId: "podis",
    tagline: "Bold, Garlicky Comfort",
    summary: "Our much-loved idli podi with the warmth of roasted garlic - a deeper, bolder flavour for breakfasts with a little more character.",
    description:
      "Everything you love about our classic idli podi, with roasted garlic folded in. Earthy, warming and wonderfully aromatic - the kind of podi that makes you reach for one more idli.",
    keyIngredients: ["Garlic", "Lentils", "Red chillies", "Curry leaves"],
    howToUse: PODI_USE,
    packType: "pouch",
    palette: { bg: "#EFE6D2", ink: "#2A2118", accent: "#B5651D", deep: "#3B4A1E" },
    sprites: ["garlic", "chilli", "uradDal", "curryLeaf"],
    featured: false,
    p100: 80,
    stock: [40, 28, 16, 20, 9],
  },
  {
    slug: "groundnut-podi",
    name: "Groundnut Podi",
    categoryId: "podis",
    tagline: "Nutty, Rustic, Homely",
    summary: "Roasted groundnuts and spices come together in a rustic podi that's as comforting with hot rice as it is with idli and dosa.",
    description:
      "A family favourite from the village kitchen. Groundnuts are roasted golden and ground with chillies and garlic into a nutty, slightly coarse podi. Mix it with rice and a spoon of ghee, or pair it with idli, dosa and upma.",
    keyIngredients: ["Groundnuts", "Red chillies", "Garlic", "Curry leaves"],
    howToUse: "Mix with hot rice and a little ghee or gingelly oil, or serve alongside idli, dosa and upma.",
    packType: "pouch",
    palette: { bg: "#F0DFC0", ink: "#2B1E14", accent: "#A4572E", deep: "#5A2E14" },
    sprites: ["peanut", "chilli", "garlic", "curryLeaf"],
    featured: true,
    p100: 75,
    stock: [44, 30, 20, 26, 12],
  },
  {
    slug: "paruppu-podi",
    name: "Paruppu Podi",
    altName: "Fried Gram Dhal Powder",
    categoryId: "podis",
    tagline: "Tradition in Every Spoon",
    summary: "A flavourful reminder of our roots, where simple ingredients create beautiful family memories.",
    description:
      "Made with pottukadalai (roasted gram dal), this gentle, flavourful podi is how many of us first learned to love rice. Mix it with hot rice and ghee, or sprinkle it over idli, dosa and upma.",
    keyIngredients: ["Roasted gram dal", "Red chillies", "Garlic"],
    howToUse: "Mix with hot rice and a spoon of ghee. Also lovely over idli, dosa and upma.",
    packType: "pouch",
    palette: { bg: "#F3EAC8", ink: "#2A2414", accent: "#C9A227", deep: "#4A5A1A" },
    sprites: ["chanaDal", "chilli", "garlic", "curryLeaf"],
    featured: false,
    p100: 70,
    stock: [38, 26, 18, 22, 10],
  },
  {
    slug: "curry-leaf-rice-mix",
    name: "Curry Leaf Rice Mix",
    altName: "Curry Leaves Podi",
    categoryId: "rice-mixes",
    tagline: "Nature's Green Goodness",
    summary: "Inspired by the goodness of nature, bringing traditional flavour and familiar comfort to your family's table.",
    description:
      "Curry leaves, lentils and spices, roasted and ground into a fragrant green mix. Stir it through hot rice for a quick, comforting meal - or use it to lift upma, idli and dosa.",
    keyIngredients: ["Curry leaves", "Lentils", "Groundnuts", "Red chillies"],
    howToUse: RICE_MIX_USE,
    packType: "pouch",
    palette: { bg: "#E2EBC6", ink: "#18291A", accent: "#5E8C2A", deep: "#1E4D2B" },
    sprites: ["curryLeaf", "peanut", "uradDal", "chilli"],
    featured: true,
    p100: 80,
    stock: [42, 34, 20, 24, 11],
  },
  {
    slug: "moringa-rice-mix",
    name: "Moringa Rice Mix",
    categoryId: "rice-mixes",
    tagline: "Greens, the Gentle Way",
    summary: "The earthy goodness of moringa leaves in an easy rice mix - a simple way to bring greens to everyday meals.",
    description:
      "Murungai keerai has always been part of our grandmothers' kitchens. We've brought it into an easy rice mix with lentils and spices, so a wholesome green meal is just a spoonful away.",
    keyIngredients: ["Moringa leaves", "Lentils", "Spices"],
    howToUse: RICE_MIX_USE,
    packType: "pouch",
    palette: { bg: "#DDE8C6", ink: "#18291A", accent: "#6E9B2F", deep: "#23502A" },
    sprites: ["moringa", "peanut", "uradDal", "chilli"],
    featured: false,
    p100: 90,
    stock: [30, 22, 3, 16, 8],
  },
  {
    slug: "sprouted-millet-health-mix",
    name: "Sprouted Millet Health Mix",
    categoryId: "health-mixes",
    tagline: "Back to Our Roots",
    summary: "Bringing the goodness of traditional millets closer to modern families, one wholesome serving at a time.",
    description:
      "Traditional millets and pulses, sprouted and roasted, then blended with nuts into a wholesome everyday mix. Cook it into a warm porridge for the family - the way it has nourished generations.",
    keyIngredients: ["Sprouted millets", "Pulses", "Almonds", "Cashews"],
    howToUse: "Whisk 2 tablespoons into a cup of water or milk. Cook on a low flame for 3–5 minutes, stirring. Sweeten with jaggery, or season with salt and buttermilk.",
    packType: "jar",
    palette: { bg: "#F2DFA4", ink: "#2E2410", accent: "#B98524", deep: "#6B4A12" },
    sprites: ["millet", "mungBean", "almond", "cashew", "horseGram"],
    featured: true,
    p100: 95,
    stock: [36, 30, 24, 28, 15],
  },
  {
    slug: "abc-malt",
    name: "ABC Malt",
    altName: "ABC Nutri Powder",
    categoryId: "health-mixes",
    tagline: "Goodness in Every Sip",
    summary: "A lovely blend of apple, beetroot and carrot, bringing natural goodness and delicious moments to your daily routine.",
    description:
      "Apple, beetroot and carrot meet almonds and cashews in a naturally colourful drink mix. A cheerful, delicious way to add a little goodness to the morning routine - for kids and grown-ups alike.",
    keyIngredients: ["Apple", "Beetroot", "Carrot", "Almonds", "Cashews"],
    howToUse: "Stir 2 tablespoons into a glass of warm or chilled milk. Sweeten to taste.",
    packType: "box",
    palette: { bg: "#F4D4D7", ink: "#3A1218", accent: "#B3263A", deep: "#7A1528" },
    sprites: ["appleSlice", "beetSlice", "carrotSlice", "almond", "cashew"],
    featured: true,
    p100: 150,
    stock: [34, 26, 18, 14, 0],
  },
  {
    slug: "nendran-banana-malt",
    name: "Nendran Banana Malt",
    categoryId: "health-mixes",
    tagline: "Childhood Memories in Every Sip",
    summary: "Inspired by the familiar taste of traditional Nendran banana, bringing comfort and deliciousness to every cup.",
    description:
      "Kerala's beloved Nendran banana - the first food of so many childhoods - made into a smooth, comforting malt with almonds and dates. Warm, mildly sweet and deeply familiar.",
    keyIngredients: ["Nendran banana", "Almonds", "Dates"],
    howToUse: "Mix 2 tablespoons with a little water into a smooth paste, add a cup of milk and cook for 3–4 minutes, stirring. Sweeten to taste.",
    packType: "jar",
    palette: { bg: "#F5E39A", ink: "#2E2508", accent: "#C99A1E", deep: "#5E4A08" },
    sprites: ["bananaSlice", "almond", "date", "cardamom"],
    featured: true,
    p100: 120,
    stock: [32, 24, 18, 20, 9],
  },
  {
    slug: "plant-based-protein",
    name: "Plant-Based Protein",
    categoryId: "wellness",
    tagline: "Nourishment from Nature",
    summary: "Thoughtfully blended plant-based ingredients to make everyday nutrition a little more meaningful.",
    description:
      "A thoughtful blend of pulses, grains, nuts and seeds for everyday nourishment. No fuss - just plant-based goodness you can blend into milk, water or a smoothie.",
    keyIngredients: ["Pulses", "Grains", "Nuts & seeds"],
    howToUse: "Blend 2 scoops (about 30 g) with milk, water or a smoothie. Enjoy once a day alongside a balanced diet.",
    packType: "jar",
    palette: { bg: "#E6D8C6", ink: "#2A1C12", accent: "#7A4B2A", deep: "#4A2C17" },
    sprites: ["soybean", "mungBean", "almond", "cashew"],
    featured: true,
    p100: 190,
    stock: [26, 22, 16, 18, 7],
  },
  {
    slug: "protein-plus",
    name: "Protein Plus",
    altName: "Weight Gain Powder",
    categoryId: "wellness",
    tagline: "Care in Every Scoop",
    summary: "A nourishing combination of selected ingredients, created to complement your family's balanced nutrition journey.",
    description:
      "Grains, pulses, dates and nuts in a nourishing everyday blend, made to complement balanced meals for growing children and active adults.",
    keyIngredients: ["Grains & pulses", "Dates", "Nuts"],
    howToUse: "Mix 2 scoops into a glass of milk or a banana smoothie. Best enjoyed alongside regular, balanced meals.",
    packType: "jar",
    palette: { bg: "#E9DEC2", ink: "#2A2014", accent: "#8A5A3B", deep: "#3F5A1E" },
    sprites: ["almond", "date", "peanut", "soybean", "bananaSlice"],
    featured: true,
    p100: 170,
    stock: [28, 24, 14, 16, 4],
  },
  {
    slug: "slim-mix",
    name: "Slim Mix",
    categoryId: "wellness",
    tagline: "A Little Care Every Day",
    summary: "A thoughtfully prepared blend to accompany balanced eating habits and a healthy lifestyle.",
    description:
      "A light, wholesome blend of millets, pulses and seeds, prepared to accompany balanced eating habits and an active lifestyle.",
    keyIngredients: ["Millets", "Pulses", "Nuts & seeds"],
    howToUse: "Whisk 2 tablespoons into warm water or buttermilk. Enjoy as a light breakfast or evening drink.",
    packType: "jar",
    palette: { bg: "#E5ECD6", ink: "#1B2A1C", accent: "#4E8F2F", deep: "#244A2A" },
    sprites: ["millet", "horseGram", "mungBean", "almond"],
    featured: false,
    p100: 130,
    stock: [30, 22, 16, 12, 0],
  },
];

const SKU_CODES: Record<string, string> = {
  "idli-podi": "IDP",
  "garlic-idli-podi": "GIP",
  "groundnut-podi": "GNP",
  "paruppu-podi": "PRP",
  "curry-leaf-rice-mix": "CLR",
  "moringa-rice-mix": "MRM",
  "sprouted-millet-health-mix": "SMH",
  "abc-malt": "ABC",
  "nendran-banana-malt": "NBM",
  "plant-based-protein": "PBP",
  "protein-plus": "PPL",
  "slim-mix": "SLM",
};

/** Intrinsic sizes of the 2x pack renders in /public/images/products. */
export const RENDER_SIZES: Record<string, [number, number]> = {"abc-malt": [1526, 2182], "curry-leaf-rice-mix": [1390, 2282], "garlic-idli-podi": [1366, 2226], "groundnut-podi": [1474, 2296], "idli-podi": [1516, 2234], "moringa-rice-mix": [1504, 2186], "nendran-banana-malt": [1194, 2278], "paruppu-podi": [1580, 2328], "plant-based-protein": [1090, 2326], "protein-plus": [1142, 2314], "slim-mix": [1066, 2202], "sprouted-millet-health-mix": [1086, 2332]};

/** ₹ price for a pack size, rounded to the nearest ₹5, returned in paise. */
export function placeholderPrice(p100: number, weightG: number) {
  const rupees = p100 * (weightG / 100) * SIZE_FACTOR[weightG];
  return Math.round(rupees / 5) * 5 * 100;
}

const CREATED = "2026-11-01T09:00:00.000Z";

export function buildSeedProducts(): Product[] {
  return seeds.map((s, index) => {
    const id = `p-${s.slug}`;
    const variants: Variant[] = WEIGHTS.map((w, i) => ({
      id: `v-${s.slug}-${w}`,
      productId: id,
      weightG: w,
      sku: `RF-${SKU_CODES[s.slug]}-${w}`,
      price: placeholderPrice(s.p100, w),
      mrp: null,
      stock: s.stock[i],
      isActive: true,
    }));
    return {
      id,
      slug: s.slug,
      name: s.name,
      altName: s.altName ?? null,
      categoryId: s.categoryId,
      tagline: s.tagline,
      summary: s.summary,
      description: s.description,
      keyIngredients: s.keyIngredients,
      ingredients: null,
      howToUse: s.howToUse,
      packType: s.packType,
      image: `/images/products/${s.slug}.webp`,
      imageWidth: RENDER_SIZES[s.slug]?.[0] ?? 1200,
      imageHeight: RENDER_SIZES[s.slug]?.[1] ?? 1800,
      scene: `/images/scenes/${s.slug}.webp`,
      palette: s.palette,
      sprites: s.sprites,
      featured: s.featured,
      isActive: true,
      sort: index + 1,
      ratingAvg: 0,
      ratingCount: 0,
      variants,
      createdAt: CREATED,
    };
  });
}

export const defaultSettings: StoreSettings = {
  freeShippingThreshold: 99900,
  codEnabled: true,
  codFee: 4000,
  codMaxOrder: 500000,
  lowStockThreshold: 5,
  announcement: "Free shipping on orders above ₹999 · Delivered across India in 3–5 days",
  zones: {
    chennai: { label: "Chennai", base: 4000, perExtra500g: 1500, eta: "2–3 days" },
    "tamil-nadu": { label: "Tamil Nadu & Puducherry", base: 5000, perExtra500g: 2000, eta: "3–4 days" },
    south: { label: "South India", base: 7000, perExtra500g: 2500, eta: "3–5 days" },
    national: { label: "Rest of India", base: 9000, perExtra500g: 3500, eta: "3–5 days" },
    remote: { label: "North East, J&K & Islands", base: 12000, perExtra500g: 5000, eta: "5–7 days" },
  },
  contact: {
    email: "ritanfoods.co.in@gmail.com",
    phone: "+91 70104 60911",
    whatsapp: "+917010460911",
    address: "No. 3/7, Rajajinagar 5th Street, Villivakkam, Chennai, Tamil Nadu 600049, India",
    gstin: "33AQOPR4512N1ZE",
    fssai: "22426530000152",
  },
};

export function buildSeedCoupons(): Coupon[] {
  return [
    {
      code: "WELCOME10",
      description: "10% off your first order (up to ₹150) on orders above ₹499",
      type: "percent",
      value: 10,
      minSubtotal: 49900,
      maxDiscount: 15000,
      startsAt: null,
      endsAt: null,
      usageLimit: null,
      perCustomerLimit: 1,
      isActive: true,
      usedCount: 0,
      createdAt: CREATED,
    },
    {
      code: "TRADITION100",
      description: "₹100 off on orders above ₹999",
      type: "flat",
      value: 10000,
      minSubtotal: 99900,
      maxDiscount: null,
      startsAt: null,
      endsAt: null,
      usageLimit: 500,
      perCustomerLimit: 3,
      isActive: true,
      usedCount: 0,
      createdAt: CREATED,
    },
    {
      code: "FREESHIP",
      description: "Free shipping on orders above ₹599",
      type: "free_shipping",
      value: 0,
      minSubtotal: 59900,
      maxDiscount: null,
      startsAt: null,
      endsAt: null,
      usageLimit: null,
      perCustomerLimit: null,
      isActive: true,
      usedCount: 0,
      createdAt: CREATED,
    },
  ];
}

/** Sample reviews, flagged `isDemo`. Shown only in demo mode; never seeded to production. */
export function buildDemoReviews(): Review[] {
  const r = (slug: string, authorName: string, location: string, rating: number, title: string, body: string, days: number): Review => ({
    id: `r-${slug}-${authorName.split(" ")[0].toLowerCase()}`,
    productId: `p-${slug}`,
    productSlug: slug,
    userId: null,
    authorName,
    location,
    rating,
    title,
    body,
    verifiedPurchase: true,
    isApproved: true,
    isDemo: true,
    createdAt: new Date(Date.UTC(2026, 10, 20) - days * 86400000).toISOString(),
  });
  return [
    r("idli-podi", "Lakshmi R.", "Chennai", 5, "Tastes like my amma's", "The texture is just right - not too fine. With a little gingelly oil it takes me straight back home.", 3),
    r("idli-podi", "Arjun K.", "Bengaluru", 5, "Breakfast, sorted", "I keep a pack at work now. Goes with idli, dosa and even curd rice.", 9),
    r("garlic-idli-podi", "Vignesh A.", "Chennai", 5, "Garlic lovers, this is it", "Bold and aromatic. We finished the first pack in a week!", 6),
    r("groundnut-podi", "Karthik M.", "Salem", 4, "Nutty and rustic", "Great with hot rice and ghee. Would love a spicier version too.", 12),
    r("paruppu-podi", "Ramesh T.", "Vellore", 5, "Pottukadalai podi done right", "Mild, flavourful and perfect with ghee rice.", 15),
    r("curry-leaf-rice-mix", "Meena S.", "Coimbatore", 5, "So fragrant", "Mixed it with hot rice and ghee for the kids' lunch box - they finished every bit.", 4),
    r("moringa-rice-mix", "Shalini D.", "Tirunelveli", 4, "Greens without the effort", "Quick lunch on busy days. The moringa flavour is gentle and earthy.", 18),
    r("sprouted-millet-health-mix", "Revathi N.", "Madurai", 5, "A wholesome morning porridge", "Cooks quickly and has a lovely nutty taste. I add jaggery and a pinch of cardamom.", 7),
    r("sprouted-millet-health-mix", "Ganesh B.", "Mysuru", 4, "Good everyday mix", "My parents have it every morning now. Smooth, no lumps.", 21),
    r("abc-malt", "Priya V.", "Hyderabad", 5, "My daughter loves the colour", "She asks for her 'pink drink' every morning. Mixes easily in warm milk.", 2),
    r("abc-malt", "Nandhini K.", "Chennai", 5, "Delicious and different", "Never thought apple, beetroot and carrot would taste this good together.", 11),
    r("nendran-banana-malt", "Suresh P.", "Kochi", 5, "Childhood in a cup", "Exactly the Nendran flavour I grew up with. Smooth and comforting.", 5),
    r("plant-based-protein", "Divya R.", "Pune", 4, "Easy to blend", "Blends well in a banana smoothie, and it isn't chalky.", 10),
    r("protein-plus", "Anitha G.", "Tiruchirappalli", 5, "Good with milk", "My son has it after cricket practice. He likes it best with a banana.", 8),
    r("slim-mix", "Kavya S.", "Chennai", 4, "Light and filling", "I have it with buttermilk in the evening. Simple and tasty.", 14),
  ];
}
