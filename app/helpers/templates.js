const phone_message = (otp) =>{
    return `Dear User,\n`
    + `${otp} is your otp for Phone Number Verfication. Please enter the OTP to verify your phone number.\n`
    + `Regards`
}

const email_message = (otp) =>{
    return `Dear User, \n\n` 
     + 'OTP for your email verification is : \n\n'
     + `${otp}\n\n`
     + 'This is a auto-generated email. Please do not reply to this email.\n\n'
     + 'Regards\n\n'
}

module.exports= {
    phone_message,
    email_message
};