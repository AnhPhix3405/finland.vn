import * as nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// async function main() {
//     await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: "anhphi3405@gmail.com",
//         subject: "Test mail",
//         html: "<p>Hello SMTP</p>",
//     });

//     console.log("sent");
// }

// main();