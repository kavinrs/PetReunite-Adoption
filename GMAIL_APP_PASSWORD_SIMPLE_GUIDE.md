# Gmail App Password - Simple Step-by-Step Guide

## What is an App Password?

An **App Password** is a special 16-character password that Google gives you to let apps (like your Django server) send emails through Gmail. It's NOT your regular Gmail password.

---

## Step-by-Step Instructions

### Step 1: Go to Google Account Security
1. Open your web browser
2. Go to: https://myaccount.google.com/security
3. Log in with your Gmail account if needed

### Step 2: Enable 2-Step Verification (if not already enabled)
1. Look for "2-Step Verification" section
2. If it says "Off", click it and turn it ON
3. Follow Google's instructions to set it up (usually phone verification)
4. **Important**: You MUST have 2-Step Verification ON to create App Passwords

### Step 3: Create App Password
1. After 2-Step Verification is ON, go back to: https://myaccount.google.com/security
2. Scroll down and find "2-Step Verification" section
3. Click on "2-Step Verification"
4. Scroll down to the bottom of that page
5. You'll see "App passwords" section
6. Click on "App passwords"

### Step 4: Generate the Password
1. You'll see a dropdown that says "Select app"
2. Click it and choose **"Mail"**
3. Another dropdown appears that says "Select device"
4. Click it and choose **"Other (Custom name)"**
5. Type a name like: **"PawReunite Django"** or **"Pet Portal"**
6. Click **"Generate"**

### Step 5: Copy the Password
1. Google will show you a 16-character password in a yellow box
2. It looks like: `abcd efgh ijkl mnop` (with spaces)
3. **COPY THIS PASSWORD** - you'll only see it once!
4. Click "Done"

---

## What to Do with the Password

### Create Backend/.env file

1. Open your project folder
2. Go to the `Backend` folder (where `manage.py` is)
3. Create a new file called `.env` (yes, it starts with a dot)
4. Add these lines:

```env
EMAIL_HOST_USER=youremail@gmail.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop
DEFAULT_FROM_EMAIL=noreply@pawreunite.com
```

**Important Notes:**
- Replace `youremail@gmail.com` with YOUR actual Gmail address
- Replace `abcdefghijklmnop` with the 16-character password Google gave you
- **Remove the spaces** from the password (Google shows it with spaces, but you need to remove them)
- Example: If Google shows `abcd efgh ijkl mnop`, you type `abcdefghijklmnop`

### Example .env file:

```env
EMAIL_HOST_USER=john.doe@gmail.com
EMAIL_HOST_PASSWORD=xyzw1234abcd5678
DEFAULT_FROM_EMAIL=noreply@pawreunite.com
```

---

## Restart Your Server

1. Stop your Django server (press `Ctrl+C` in the terminal)
2. Start it again:
   ```bash
   python Backend/manage.py runserver
   ```

---

## Test It!

1. Go to your admin registration page
2. Enter an email and click "Verify"
3. Check your email inbox
4. You should receive the verification code by email! 📧

---

## Common Problems

### "I don't see App passwords option"
- Make sure 2-Step Verification is turned ON
- Wait a few minutes after enabling 2-Step Verification
- Try logging out and back into your Google Account

### "Authentication failed" error
- You're using your regular Gmail password instead of the App Password
- Create a new App Password and try again
- Make sure you removed all spaces from the password

### "Still printing to console, not sending email"
- Check that `.env` file is in the `Backend` folder (same folder as `manage.py`)
- Make sure the file is named exactly `.env` (not `.env.txt`)
- Restart the Django server completely
- Check for typos in your email or password

### "Invalid credentials"
- The App Password might be wrong
- Go back to Google Account Security and create a NEW App Password
- Copy it carefully without spaces

---

## Quick Checklist

- [ ] 2-Step Verification is ON in Google Account
- [ ] Created App Password from Google Account Security
- [ ] Copied the 16-character password
- [ ] Created `Backend/.env` file
- [ ] Added EMAIL_HOST_USER with your Gmail
- [ ] Added EMAIL_HOST_PASSWORD with the App Password (no spaces)
- [ ] Restarted Django server
- [ ] Tested by sending verification email

---

## Need More Help?

If you're still stuck, tell me:
1. Which step are you on?
2. What do you see on your screen?
3. Any error messages?

I'll help you figure it out! 😊
