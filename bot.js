const nodemailer = require("nodemailer");

// Create a transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "davidchuksdev@gmail.com",
    pass: "mtxhfuteirjguheu",
  },
});

// List of recipients
const recipients = [
  
    "Hunttactical@gmail.com",
    "contact@shopviralonline.com",
    "shoprovelo@gmail.com",
    "Info@artbylukeleal.com",
    "kdstuff.service@gmail.com",
    "support@tiaarthouse.com",
    "info@liveforvitality.com",
    "help@BoldlyBeautiful.com",
    "support@herabodycare.com",
    "help@toshty.com",
    "tryeyeconic@gmail.com",
    "buffalobitsandpieces@gmail.com",
    "info@thehoundandhome.net",
    "support@northauroras.com",
    "info@khlcornerstore.com",
    "radiantluxeloom@gmail.com",
    "Regalreflectionsjewelry24@gmail.com",
    "martasbazar@outlook.com",
    "katygirlscreations@gmail.com",
    "Joeyhityou@gmail.com",
    "seasonalgiftshub@gmail.com",
    "support@zaluxy.com",
    "innovativeclubwm@gmail.com",
    "Catsupplystores@gmail.com",
    "support@clearpicks.co",
    "sammysworld489@gmail.com",
    "info@filthy420.com",
    "quietacres.co@gmail.com",
    "info@popularpets123.com",
    "info@mimishoom.com",
    "fithavenco1@gmail.com",
    "info@theflashlightdepot.com",
    "support@511-ranger.com",
    "hello@storeykeepsakes.com",
    "help@tryhavenandco.com",
    "petjoyshopteam@gmail.com",
    "furreverbestie@gmail.com",
    "info@frothhhh.com",
    "sales.lemmor@outlook.com",
    "info@pallet.com.co",
    "clarizensupplements@gmail.com",
    "info@thechargerzone.com",
    "hello@purekindliving.com",
    "info@rickbypets.com",
    "Bellelegance@outlook.com"
  
];

// List of subjects and messages
const subjects = [
  "Quick Check: Is Your Website Active Today?",
  "Shipping & First-Time Buyer Benefits Inquiry",
  "Website Status: Are You Still Taking Orders?",
];
const messages = [
  "Hi there, is your website still active for today??",
  "Howdy, how long does shipping take on average on your website, and is there any benefit for first-time buyers??",
  "G’day, is your website still up and active to take orders??",
];

// Function to shuffle an array
const shuffle = (array) => array.sort(() => Math.random() - 0.5);

// Shuffle subjects and messages
shuffle(subjects);
shuffle(messages);

// Send emails with randomized subjects and messages
recipients.forEach((recipient, index) => {
  const mailOptions = {
    from: "davidchuksdev@gmail.com",
    to: recipient,
    subject: subjects[index % subjects.length], // Assign shuffled subject
    text: messages[index % messages.length], // Assign shuffled message
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(`Error sending to ${recipient}:`, error);
    } else {
      console.log(`Email sent to ${recipient}:`, info.response);
    }
  });
});
