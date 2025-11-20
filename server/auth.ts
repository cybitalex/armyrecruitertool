import bcrypt from 'bcrypt';
import crypto from 'crypto';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import { db } from './database';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';

const SALT_ROUNDS = 10;

// Email transporter - handle ESM/CommonJS interop
const transporter = (nodemailer.default || nodemailer).createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Generate unique QR code identifier
export function generateQRCode(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Legacy alias for backwards compatibility
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return comparePassword(password, hash);
}

// Generate verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Send verification email
export async function sendVerificationEmail(email: string, token: string) {
  // Use frontend route that will handle the API call
  const verificationUrl = `${process.env.APP_URL || 'https://armyrecruitertool.duckdns.org'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `Army Recruiter Tool <${process.env.SMTP_USER || 'alex.cybitdevs@gmail.com'}>`,
    to: email,
    subject: 'Verify Your Army Recruiter Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006400;">Welcome to Army Recruiter Tool! 🎖️</h2>
        <p>Thank you for registering. Please verify your email address to complete your registration.</p>
        <p>
          <a href="${verificationUrl}" style="background-color: #006400; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours. If you didn't create an account, please ignore this email.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          <strong>UNCLASSIFIED</strong><br>
          Army Recruiter Tool - For Official Use Only (FOUO)<br>
          Developed by SGT Alex Moran - CyBit Devs
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.APP_URL || 'https://armyrecruitertool.duckdns.org'}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `Army Recruiter Tool <${process.env.SMTP_USER || 'alex.cybitdevs@gmail.com'}>`,
    to: email,
    subject: 'Reset Your Army Recruiter Account Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006400;">Password Reset Request</h2>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p>
          <a href="${resetUrl}" style="background-color: #006400; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          <strong>UNCLASSIFIED</strong><br>
          Army Recruiter Tool
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

// Send applicant confirmation email
export async function sendApplicantConfirmationEmail(
  applicantEmail: string,
  firstName: string,
  lastName: string,
  recruiterId?: string
) {
  let recruiterInfo = null;
  
  // Get recruiter info if recruiterId is provided
  if (recruiterId) {
    const recruiter = await db.query.users.findFirst({
      where: eq(users.id, recruiterId),
    });
    
    if (recruiter) {
      recruiterInfo = {
        name: recruiter.fullName,
        rank: recruiter.rank,
        unit: recruiter.unit,
        email: recruiter.email,
        phone: recruiter.phoneNumber,
      };
    }
  }
  
  const mailOptions = {
    from: `Army Recruiter Tool <${process.env.SMTP_USER || 'alex.cybitdevs@gmail.com'}>`,
    to: applicantEmail,
    subject: 'Application Received - U.S. Army Recruiting',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006400;">Application Received! 🎖️</h2>
        <p>Dear ${firstName} ${lastName},</p>
        <p>Thank you for your interest in joining the U.S. Army. We have successfully received your application.</p>
        
        ${recruiterInfo ? `
        <div style="background-color: #f0f8f0; padding: 20px; border-left: 4px solid #006400; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #006400; margin-top: 0; font-size: 18px;">Your Recruiter Contact Information:</h3>
          <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
            <p style="margin: 8px 0; font-size: 16px;"><strong>${recruiterInfo.rank ? recruiterInfo.rank + ' ' : ''}${recruiterInfo.name}</strong></p>
            ${recruiterInfo.unit ? `<p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Unit:</strong> ${recruiterInfo.unit}</p>` : ''}
            ${recruiterInfo.phone ? `<p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Phone:</strong> <a href="tel:${recruiterInfo.phone}" style="color: #006400; text-decoration: none;">${recruiterInfo.phone}</a></p>` : ''}
            ${recruiterInfo.email ? `<p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${recruiterInfo.email}" style="color: #006400; text-decoration: none;">${recruiterInfo.email}</a></p>` : ''}
          </div>
          <p style="margin: 15px 0 0 0; font-size: 14px; color: #006400; font-weight: 500;">✓ Your recruiter will contact you soon to discuss next steps.</p>
        </div>
        ` : `
        <p style="color: #666;">A recruiter will review your application and contact you soon to discuss next steps.</p>
        `}
        
        <div style="background-color: #fff9e6; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">What Happens Next?</h3>
          <ul style="color: #856404; line-height: 1.8;">
            <li>Your application will be reviewed by an Army recruiter</li>
            <li>A recruiter will contact you within 48-72 hours</li>
            <li>Be prepared to discuss your interest, qualifications, and goals</li>
            <li>You may be asked to provide additional documentation</li>
          </ul>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          <strong>UNCLASSIFIED</strong><br>
          Army Recruiter Tool - For Official Use Only (FOUO)<br>
          This is an automated confirmation. Please do not reply to this email.<br>
          If you have questions, contact your recruiter directly.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Confirmation email sent to applicant: ${applicantEmail}`);
  } catch (error) {
    console.error('❌ Failed to send applicant confirmation email:', error);
    throw new Error('Failed to send applicant confirmation email');
  }
}

// Send survey/feedback confirmation email
export async function sendSurveyConfirmationEmail(
  email: string,
  name: string,
  rating: number,
  recruiterId?: string
) {
  let recruiterInfo = null;
  
  // Get recruiter info if recruiterId is provided
  if (recruiterId) {
    const recruiter = await db.query.users.findFirst({
      where: eq(users.id, recruiterId),
    });
    
    if (recruiter) {
      recruiterInfo = {
        name: recruiter.fullName,
        rank: recruiter.rank,
        unit: recruiter.unit,
        email: recruiter.email,
        phone: recruiter.phoneNumber,
      };
    }
  }
  
  // Generate star rating display
  const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  
  const mailOptions = {
    from: `Army Recruiter Tool <${process.env.SMTP_USER || 'alex.cybitdevs@gmail.com'}>`,
    to: email,
    subject: 'Feedback Received - Thank You! 🎖️',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006400;">Thank You for Your Feedback! 🎖️</h2>
        <p>Dear ${name},</p>
        <p>Thank you for taking the time to provide feedback on the Army briefing. Your input helps us improve our presentation and better serve potential recruits.</p>
        
        <div style="background-color: #f0f8f0; padding: 20px; border-left: 4px solid #006400; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #006400; margin-top: 0; font-size: 18px;">Your Feedback Summary:</h3>
          <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
            <p style="margin: 8px 0; font-size: 24px;">${stars}</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">Rating: ${rating} out of 5 stars</p>
          </div>
        </div>
        
        ${recruiterInfo ? `
        <div style="background-color: #fff9e6; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #856404; margin-top: 0; font-size: 18px;">Recruiter Contact Information:</h3>
          <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
            <p style="margin: 8px 0; font-size: 16px;"><strong>${recruiterInfo.rank ? recruiterInfo.rank + ' ' : ''}${recruiterInfo.name}</strong></p>
            ${recruiterInfo.unit ? `<p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Unit:</strong> ${recruiterInfo.unit}</p>` : ''}
            ${recruiterInfo.phone ? `<p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Phone:</strong> <a href="tel:${recruiterInfo.phone}" style="color: #006400; text-decoration: none;">${recruiterInfo.phone}</a></p>` : ''}
            ${recruiterInfo.email ? `<p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${recruiterInfo.email}" style="color: #006400; text-decoration: none;">${recruiterInfo.email}</a></p>` : ''}
          </div>
          <p style="margin: 15px 0 0 0; font-size: 14px; color: #856404; font-weight: 500;">
            ✓ If you have any questions or would like more information about joining the U.S. Army, please don't hesitate to reach out!
          </p>
        </div>
        ` : ''}
        
        <div style="background-color: #e8f4ea; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h3 style="color: #006400; margin-top: 0;">Interested in Learning More?</h3>
          <p style="color: #006400; line-height: 1.6;">
            The U.S. Army offers:
          </p>
          <ul style="color: #006400; line-height: 1.8;">
            <li>Career opportunities in over 150 fields</li>
            <li>Education benefits (up to $65,000 for college)</li>
            <li>Leadership training and development</li>
            <li>Comprehensive healthcare</li>
            <li>Housing allowances and retirement benefits</li>
          </ul>
          ${recruiterInfo ? `
          <p style="color: #006400; font-weight: 500; margin-top: 15px;">
            Contact ${recruiterInfo.rank ? recruiterInfo.rank + ' ' : ''}${recruiterInfo.name} to discuss your options!
          </p>
          ` : ''}
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          <strong>UNCLASSIFIED</strong><br>
          Army Recruiter Tool - For Official Use Only (FOUO)<br>
          This is an automated confirmation. ${recruiterInfo ? 'For questions, contact your recruiter directly.' : 'A recruiter may follow up with you soon.'}
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Survey confirmation email sent to: ${email}`);
  } catch (error) {
    console.error('❌ Failed to send survey confirmation email:', error);
    throw new Error('Failed to send survey confirmation email');
  }
}

// Send notification to recruiter when they receive a survey response
export async function sendRecruiterSurveyNotification(
  recruiterEmail: string,
  recruiterName: string,
  respondentName: string,
  rating: number
) {
  const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  
  const mailOptions = {
    from: `Army Recruiter Tool <${process.env.SMTP_USER || 'alex.cybitdevs@gmail.com'}>`,
    to: recruiterEmail,
    subject: `New Survey Response Received - ${rating}/5 Stars 🎖️`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006400;">New Survey Response Received! 🎖️</h2>
        <p>Hello ${recruiterName},</p>
        <p>You've received new feedback on your Army briefing presentation.</p>
        
        <div style="background-color: #f0f8f0; padding: 20px; border-left: 4px solid #006400; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #006400; margin-top: 0; font-size: 18px;">Survey Details:</h3>
          <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
            <p style="margin: 8px 0;"><strong>Respondent:</strong> ${respondentName}</p>
            <p style="margin: 8px 0; font-size: 24px;">${stars}</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Rating:</strong> ${rating} out of 5 stars</p>
          </div>
        </div>
        
        <div style="background-color: #e8f4ea; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="color: #006400; margin: 0;">
            <strong>📊 View All Responses:</strong> Log in to your dashboard to see detailed feedback and contact information.
          </p>
        </div>
        
        <p style="margin-top: 20px;">
          <a href="${process.env.APP_URL || 'https://armyrecruitertool.duckdns.org'}/dashboard" 
             style="background-color: #006400; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Dashboard
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          <strong>UNCLASSIFIED</strong><br>
          Army Recruiter Tool - For Official Use Only (FOUO)<br>
          This is an automated notification. Do not reply to this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Survey notification sent to recruiter: ${recruiterEmail}`);
  } catch (error) {
    console.error('❌ Failed to send recruiter survey notification:', error);
    throw new Error('Failed to send recruiter survey notification');
  }
}

// Send notification to recruiter when they receive a new application via QR code
export async function sendRecruiterApplicationNotification(
  recruiterEmail: string,
  recruiterName: string,
  applicantFirstName: string,
  applicantLastName: string,
  applicantEmail: string,
  applicantPhone: string,
  source: string
) {
  const sourceText = source === 'qr_code' ? 'QR Code Scan' : 'Direct Entry';
  
  const mailOptions = {
    from: `Army Recruiter Tool <${process.env.SMTP_USER || 'alex.cybitdevs@gmail.com'}>`,
    to: recruiterEmail,
    subject: `New Application Received via ${sourceText} 🎖️`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006400;">New Application Received! 🎖️</h2>
        <p>Hello ${recruiterName},</p>
        <p>You've received a new Army recruitment application${source === 'qr_code' ? ' through your QR code' : ''}.</p>
        
        <div style="background-color: #f0f8f0; padding: 20px; border-left: 4px solid #006400; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #006400; margin-top: 0; font-size: 18px;">Applicant Information:</h3>
          <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
            <p style="margin: 8px 0; font-size: 16px;"><strong>${applicantFirstName} ${applicantLastName}</strong></p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${applicantEmail}" style="color: #006400; text-decoration: none;">${applicantEmail}</a></p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Phone:</strong> <a href="tel:${applicantPhone}" style="color: #006400; text-decoration: none;">${applicantPhone}</a></p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Source:</strong> ${sourceText}</p>
          </div>
        </div>
        
        <div style="background-color: ${source === 'qr_code' ? '#fff9e6' : '#e8f4ea'}; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="color: ${source === 'qr_code' ? '#856404' : '#006400'}; margin: 0;">
            ${source === 'qr_code' 
              ? '<strong>🎯 QR Code Success!</strong> This applicant scanned your QR code and completed the full application.' 
              : '<strong>📝 Direct Application:</strong> This application was entered directly through your intake form.'}
          </p>
        </div>
        
        <div style="background-color: #e8f4ea; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h3 style="color: #006400; margin-top: 0;">Next Steps:</h3>
          <ul style="color: #006400; line-height: 1.8; margin: 10px 0;">
            <li>Review the full application in your dashboard</li>
            <li>Contact the applicant within 48-72 hours</li>
            <li>Schedule an initial interview or screening</li>
            <li>Update the application status as you progress</li>
          </ul>
        </div>
        
        <p style="margin-top: 20px;">
          <a href="${process.env.APP_URL || 'https://armyrecruitertool.duckdns.org'}/dashboard" 
             style="background-color: #006400; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Full Application
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          <strong>UNCLASSIFIED</strong><br>
          Army Recruiter Tool - For Official Use Only (FOUO)<br>
          This is an automated notification. Do not reply to this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Application notification sent to recruiter: ${recruiterEmail}`);
  } catch (error) {
    console.error('❌ Failed to send recruiter application notification:', error);
    throw new Error('Failed to send recruiter application notification');
  }
}

// Generate QR code image for main application form
export async function generateQRCodeImage(qrCode: string): Promise<string> {
  const url = `${process.env.APP_URL || 'https://armyrecruitertool.duckdns.org'}/apply?r=${qrCode}`;

  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#006400', // Army green
        light: '#FFFFFF',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('❌ Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Generate QR code image for quick survey / presentation feedback
export async function generateSurveyQRCodeImage(qrCode: string): Promise<string> {
  const url = `${process.env.APP_URL || 'https://armyrecruitertool.duckdns.org'}/survey?r=${qrCode}`;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#006400',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('❌ Failed to generate survey QR code:', error);
    throw new Error('Failed to generate survey QR code');
  }
}

// Register new user
export async function registerUser(data: {
  email: string;
  password: string;
  fullName: string;
  rank?: string;
  unit?: string;
  phoneNumber?: string;
}) {
  try {
    console.log('🔍 Checking for existing user:', data.email);
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    console.log('🔐 Hashing password...');
    // Hash password
    const passwordHash = await hashPassword(data.password);

    console.log('🎟️ Generating verification token and QR code...');
    // Generate verification token and QR code identifier
    const verificationToken = generateVerificationToken();
    const qrCodeId = generateQRCode(); // This is the unique identifier, not the image

    console.log('💾 Creating user in database...');
    // Create user - store only the QR code identifier, not the image
    // The image will be generated on demand when needed
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        rank: data.rank,
        unit: data.unit,
        phoneNumber: data.phoneNumber,
        verificationToken,
        qrCode: qrCodeId, // Store only the identifier
        isVerified: false,
      })
      .returning();

    console.log('📧 Sending verification email...');
    // Send verification email
    try {
      await sendVerificationEmail(data.email, verificationToken);
    } catch (error) {
      console.error('⚠️ Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    console.log('✅ User registered successfully:', newUser.id);
    return {
      message: 'Registration successful! Please check your email to verify your account.',
      userId: newUser.id,
    };
  } catch (error) {
    console.error('❌ Registration error in registerUser:', error);
    throw error;
  }
}

// Verify user email
export async function verifyEmail(token: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.verificationToken, token),
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  if (user.isVerified) {
    return { message: 'Email already verified' };
  }

  // Update user as verified
  await db
    .update(users)
    .set({
      isVerified: true,
      verificationToken: null,
    })
    .where(eq(users.id, user.id));

  return { message: 'Email verified successfully! You can now log in.' };
}

// Login user
export async function loginUser(email: string, password: string) {
  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if email is verified
  if (!user.isVerified) {
    throw new Error('Please verify your email before logging in');
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  return user;
}

// Request password reset
export async function requestPasswordReset(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    // Don't reveal that user doesn't exist (security best practice)
    return { message: 'If an account exists for this email, a password reset link has been sent.' };
  }

  if (!user.isVerified) {
    throw new Error('Please verify your email before resetting your password');
  }

  // Generate reset token
  const resetToken = generateVerificationToken();
  const resetExpires = new Date();
  resetExpires.setHours(resetExpires.getHours() + 1); // Expires in 1 hour

  // Save reset token to database
  await db
    .update(users)
    .set({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    })
    .where(eq(users.id, user.id));

  // Send reset email
  try {
    await sendPasswordResetEmail(email, resetToken);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }

  return { message: 'If an account exists for this email, a password reset link has been sent.' };
}

// Reset password
export async function resetPassword(token: string, newPassword: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.resetPasswordToken, token),
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  // Check if token has expired
  if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw new Error('Reset token has expired. Please request a new one.');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password and clear reset token
  await db
    .update(users)
    .set({
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    })
    .where(eq(users.id, user.id));

  return { message: 'Password reset successfully!' };
}

// Session management
export async function createSession(req: Request, userId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      reject(new Error('Session not initialized'));
      return;
    }
    
    req.session.userId = userId;
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        reject(err);
      } else {
        console.log('✅ Session saved successfully for userId:', userId);
        resolve();
      }
    });
  });
}

export async function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      resolve();
      return;
    }
    
    req.session.destroy((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Authentication middleware
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.session.userId),
    });

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email verification required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: typeof users.$inferSelect;
      session: {
        userId?: number;
        save: (callback: (err?: any) => void) => void;
        destroy: (callback: (err?: any) => void) => void;
      };
    }
  }
}

