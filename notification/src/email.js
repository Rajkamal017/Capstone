import nodemailer from "nodemailer"



const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    }
});

// Verify the connection configuration
transporter.verify((error, success) => {
    if(error) {
        console.error("Error connecting to email server:",error);
    } else {
        console.log("Email server is ready...", success);
    }
});


// Function to send Email
export const sendEmail = async (to, subject, text, html)=>{
    try {
        const info = await transporter.sendMail({
            from: `"Capstone" <${process.env.EMAIL_USER}>`, // Sender Address
            to, // Receiver Address
            subject, // Subject
            text, // Text
            html // Html body
        });
        console.log("Email sent:",info.messageId);
        console.log("Preview URL:",nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error("Error sending email:",error);
    }
}

