/**
 * Policy copy. Refund/returns text follows the client's design document;
 * the others are written to match it (recommend a legal review before launch).
 */

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface Policy {
  slug: string;
  title: string;
  summary: string;
  updated: string;
  sections: PolicySection[];
}

const UPDATED = "22 November 2026";
const SUPPORT = [
  "Brand: Ritan Foods",
  "Email: ritanfoods.co.in@gmail.com",
  "Customer care / WhatsApp: +91 70104 60911",
  "Registered address: No. 3/7, Rajajinagar 5th Street, Villivakkam, Chennai, Tamil Nadu 600049, India",
];

export const POLICIES: Policy[] = [
  {
    slug: "refund-returns",
    title: "Return, Replacement & Refund Policy",
    summary: "Customer satisfaction and food quality are our top priorities.",
    updated: UPDATED,
    sections: [
      {
        heading: "Our approach",
        paragraphs: [
          "At Ritan Foods, customer satisfaction and food quality are our top priorities. We carefully prepare, pack and dispatch our products to help ensure they reach your home in good condition.",
        ],
      },
      {
        heading: "Return policy",
        paragraphs: [
          "As our products are food items, returns are generally not accepted once delivered due to food safety and hygiene reasons. However, customers may request a replacement or refund in the following situations:",
        ],
        bullets: ["Product received in damaged condition.", "Wrong product delivered.", "Product received with broken or tampered packaging.", "Verified quality issue or manufacturing defect."],
      },
      {
        heading: "Reporting a problem",
        paragraphs: [
          "Please contact us within 48 hours of delivery if you notice an issue. Share the order number, product name, clear photographs of the product and packaging, and a brief description of the issue.",
        ],
      },
      {
        heading: "Replacement policy",
        paragraphs: ["After verification, Ritan Foods may arrange a replacement at no additional cost, subject to product availability."],
      },
      {
        heading: "Refund policy",
        paragraphs: [
          "If a replacement is unavailable or a refund is appropriate, the refund will be processed to the original payment method or another mutually agreed payment method. The refund timeline will be communicated after approval.",
          "For Cash on Delivery orders, customers may be asked to provide valid bank or UPI refund details.",
        ],
      },
      {
        heading: "Order cancellation",
        paragraphs: ["Orders can be cancelled before dispatch by contacting customer care. Once an order has been dispatched, cancellation may not be possible."],
      },
      {
        heading: "Non-returnable products",
        paragraphs: [
          "For food safety reasons, we generally do not accept change-of-mind returns for opened food products, used products, products with seals damaged due to customer handling, or products ordered by mistake.",
        ],
      },
      {
        heading: "Shipping charges",
        paragraphs: ["For verified cases involving damaged, defective or incorrectly delivered products, Ritan Foods will bear reasonable return or replacement shipping costs."],
      },
      { heading: "Customer support", bullets: SUPPORT },
      {
        heading: "Our promise",
        paragraphs: ["At Ritan Foods, we believe that healthy food deserves honest service. Your trust, satisfaction and happiness inspire us to serve you better every day."],
      },
    ],
  },
  {
    slug: "shipping",
    title: "Shipping & Delivery Policy",
    summary: "We deliver across India with DTDC and India Post.",
    updated: UPDATED,
    sections: [
      { heading: "Where we deliver", paragraphs: ["We deliver nationwide across India."] },
      {
        heading: "Delivery partners & timelines",
        paragraphs: [
          "Orders are shipped through our logistics partners DTDC and India Post. Estimated delivery is 3 to 5 days, depending on your location. Remote locations may take a little longer.",
          "Once your order is dispatched, we email you the courier name and tracking number. You can also check your order status any time on the Track Order page.",
        ],
      },
      {
        heading: "Shipping charges",
        paragraphs: [
          "Shipping charges are calculated automatically at checkout from your delivery PIN code and the total weight of your order. Orders above the free-shipping threshold shown on the website ship free.",
          "A small handling fee applies to Cash on Delivery orders where COD is available; it is shown at checkout before you place the order.",
        ],
      },
      {
        heading: "Address accuracy",
        paragraphs: [
          "Please make sure your address, PIN code and phone number are correct. We are not responsible for delays caused by incorrect or incomplete addresses, and re-delivery may incur additional charges.",
        ],
      },
      {
        heading: "Damaged in transit",
        paragraphs: ["If your package arrives damaged or tampered with, please contact us within 48 hours of delivery with photographs. See our Return, Replacement & Refund Policy for details."],
      },
      { heading: "Contact", bullets: SUPPORT },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "How we collect, use and protect your personal information.",
    updated: UPDATED,
    sections: [
      {
        heading: "Who we are",
        paragraphs: [
          "This website is operated by Ritan Foods, a proprietorship based in Chennai, Tamil Nadu (GSTIN 33AQOPR4512N1ZE). We process personal data in line with applicable Indian law, including the Digital Personal Data Protection Act, 2023.",
        ],
      },
      {
        heading: "Information we collect",
        bullets: [
          "Contact details: your name, email address and phone number.",
          "Delivery details: shipping address and PIN code.",
          "Order details: products purchased, amounts, order history and communication about your orders.",
          "Account details if you register: your login email and a securely hashed password (we never see your password).",
          "Messages you send us through the contact form, email or WhatsApp.",
        ],
      },
      {
        heading: "Payments",
        paragraphs: [
          "Online payments are processed by Razorpay. Card, UPI and bank details are entered on Razorpay's secure checkout and are not stored on our servers. We receive only a payment reference and status.",
        ],
      },
      {
        heading: "How we use your information",
        bullets: [
          "To process, pack, ship and support your orders.",
          "To send order confirmations, shipping updates and replies to your enquiries.",
          "To keep your account, saved addresses, wishlist and order history.",
          "To prevent fraud and keep the website secure.",
        ],
      },
      {
        heading: "Sharing",
        paragraphs: [
          "We share only what is needed with service providers who help us run the store: our delivery partners (DTDC, India Post), payment processor (Razorpay), and hosting, database and email providers. We do not sell your personal data.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "We use essential cookies and local storage to keep you signed in and remember your bag and wishlist. We do not use advertising trackers.",
        ],
      },
      {
        heading: "Retention & your rights",
        paragraphs: [
          "We keep order records for as long as required for accounting and tax purposes, and other data only as long as it is needed. You can ask us to access, correct or delete your personal data by emailing ritanfoods.co.in@gmail.com.",
        ],
      },
      { heading: "Contact", bullets: SUPPORT },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    summary: "The terms that apply when you use this website and buy from us.",
    updated: UPDATED,
    sections: [
      {
        heading: "About these terms",
        paragraphs: ["By using ritanfoods.in or placing an order, you agree to these terms. Ritan Foods may update them from time to time; the version on this page applies to your order."],
      },
      {
        heading: "Products",
        paragraphs: [
          "We describe our products as accurately as we can. Packaging and colours may vary slightly from the images shown. Always read the product label for ingredients, allergens and storage instructions before use.",
        ],
      },
      {
        heading: "Prices & payment",
        paragraphs: [
          "Prices are in Indian Rupees and include applicable taxes. Shipping charges are shown at checkout. Payment can be made online through Razorpay or, where available, by Cash on Delivery.",
          "If a product is listed at an incorrect price due to an error, we may cancel the order and refund any amount paid.",
        ],
      },
      {
        heading: "Orders",
        paragraphs: [
          "An order is confirmed once payment is received (or, for Cash on Delivery, once we confirm it). We may cancel orders that cannot be fulfilled, for example when a product is out of stock, and will refund any amount paid.",
        ],
      },
      {
        heading: "Shipping, returns & refunds",
        paragraphs: ["Delivery, returns, replacements and refunds are governed by our Shipping & Delivery Policy and our Return, Replacement & Refund Policy."],
      },
      {
        heading: "Accounts",
        paragraphs: ["You are responsible for keeping your account credentials confidential. You can also check out as a guest without creating an account."],
      },
      {
        heading: "Intellectual property",
        paragraphs: ["The Ritan Foods name, logo, product designs, photographs and website content belong to Ritan Foods and may not be used without permission."],
      },
      {
        heading: "Liability",
        paragraphs: ["To the extent permitted by law, our liability for any order is limited to the amount paid for that order."],
      },
      {
        heading: "Governing law",
        paragraphs: ["These terms are governed by the laws of India. Courts in Chennai, Tamil Nadu shall have jurisdiction."],
      },
      { heading: "Contact", bullets: SUPPORT },
    ],
  },
];

export const getPolicy = (slug: string) => POLICIES.find((p) => p.slug === slug) ?? null;
