import axios from "axios";
import * as cheerio from "cheerio";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const siteId = {
  amazon: "amazon",
  flipkart: "flipkart",
};

const result = {
  [siteId.amazon]: null,
  [siteId.flipkart]: null,
};

async function scrapeData(url, site) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let titleSelector =
      site === siteId.amazon
        ? "#productTitle"
        : site === siteId.flipkart
        ? ".B_NuCI"
        : "";
    let priceSelector =
      site === siteId.amazon
        ? "#corePriceDisplay_desktop_feature_div span.a-price-whole"
        : site === siteId.flipkart
        ? "._30jeq3._16Jk6d"
        : "";

    const productName = $(titleSelector).text().trim();
    const priceString = $(priceSelector).text();
    const price = parseFloat(priceString.replace(/[^0-9\.]+/g, "", ""));
    return {
      url,
      productName,
      price,
    };
  } catch (err) {
    console.error("error - ", err);
  }
}

result[siteId.amazon] = await scrapeData(
  "https://amzn.eu/d/aV5siDB",
  siteId.amazon
);
result[siteId.flipkart] = await scrapeData(
  "https://www.flipkart.com/philips-bhh880-10-hair-straightener/p/itm516c9b1135ffe?pid=HSTFG4SHRUMXAZUG&lid=LSTHSTFG4SHRUMXAZUGYZS3MO&marketplace=FLIPKART&store=zlw&srno=b_1_4&otracker=hp_omu_Best%2Bof%2BElectronics_3_3.dealCard.OMU_7PUE1VEHTJKZ_3&otracker1=hp_omu_PINNED_neo%2Fmerchandising_Best%2Bof%2BElectronics_NA_dealCard_cc_3_NA_view-all_3&fm=neo%2Fmerchandising&iid=3d25d03d-927b-4560-acc7-4e1b098815c1.HSTFG4SHRUMXAZUG.SEARCH&ppt=hp&ppn=homepage&ssid=zrdc5e6jcg0000001673273974615",
  siteId.flipkart
);

let subject = "";
let body = "";
if (result[siteId.amazon].price > result[siteId.flipkart].price) {
  subject = "Flipkart price drop";
  body = `
  <p>Your Flipkart product <b>${
    result[siteId.flipkart].productName
  }</b> of <b>Rs ${result[siteId.flipkart].price}</b> is cheaper</p>
  <a href='${result[siteId.flipkart].url}' >Click here</a>
  `;
} else if (result[siteId.amazon].price < result[siteId.flipkart].price) {
  subject = "Amazon price drop";
  body = `
  <p>Your Amazon product <b>${result[siteId.amazon].productName}</b> of <b>Rs ${
    result[siteId.amazon].price
  }</b> is cheaper</p>
  <a href='${result[siteId.amazon].url}' >Click here</a>
  `;
} else {
  subject = "Price same at amazon and flipkart";
  body = `
  <p>Both product are of same prices.</p>
  <p> <b>${result[siteId.amazon].productName}</b> of <b>Rs ${
    result[siteId.amazon].price
  }</b> <a href='${result[siteId.amazon].url}' >Click here</a> </p>
  <p> <b>${result[siteId.flipkart].productName}</b> of <b>Rs ${
    result[siteId.flipkart].price
  }</b> <a href='${result[siteId.flipkart].url}' >Click here</a> </p>
  
  `;
}

sendEmail(subject, body)
  .then(() => {
    console.log("Message sent");
  })
  .catch((error) => {
    console.log(
      "error sending emails -> ",
      error.response.body.errors[0].message
    );
  });

function sendEmail(subject, body) {
  const email = {
    to: "goswamisushma30@gmail.com",
    from: "goswamisush13@gmail.com",
    subject: subject,
    text: body,
    html: body,
  };
  return sgMail.send(email);
}
