// Function to send an SMS
exports.sendSMS = async (name, code, phone, message) => {
    try {
      const { accountSid, authToken, twilioPhoneNumber } = process.env;
  
      const client = require('twilio')(accountSid, authToken);
      const smsBody = `Message: Hi ${name},\n\n${message}\nCode: ${code}\n`;
  
      // Send the SMS
      const response = await client.messages.create({
        body: smsBody,
        from: twilioPhoneNumber,
        to: phone
      });
  
      // Log the message SID for reference
      console.log(`Message SID: ${response.sid}`);
      return response;
    } catch (error) {
      console.error('SMS sending failed:', error.message);
      throw error
    }
  };