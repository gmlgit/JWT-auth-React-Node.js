const nodemailer = require("nodemailer");

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  async sendActivationMail(to, link) {
    await this.transporter.sendMail(
      {
        from: process.env.SMTP_USER,
        to: process.env.SMTP_USER,
        subject: "Активация аккаунта " + process.env.API_URL,
        text: "",
        html: `
      <div>
        <h1>Для активации перейдите</h1>
        <a href="${link}">${link}</a>

      </div>
      `,
      },
      (err, info) => {
        console.log("error:");
        console.log(err);
        console.log("info:");
        console.log(info);
      }
    );
  }
}

module.exports = new MailService();
