// Background job to check for upcoming shippers and send notifications
// Run this periodically (e.g., daily) via cron or scheduler

import { db } from './database';
import { recruits, users, notifications } from '../shared/schema';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import nodemailer from 'nodemailer';

// Email transporter
const transporter = (nodemailer.default || nodemailer).createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function checkUpcomingShippers() {
  console.log('🔔 Checking for upcoming shippers...');
  
  try {
    // Calculate date 3 days from now
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999); // End of day
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day
    
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`📅 Looking for shippers between ${todayStr} and ${threeDaysStr}`);
    
    // Find recruits shipping within 3 days who haven't been notified
    const upcomingShippers = await db
      .select({
        recruitId: recruits.id,
        recruitName: sql<string>`${recruits.firstName} || ' ' || ${recruits.lastName}`,
        shipDate: recruits.shipDate,
        component: recruits.component,
        actualMOS: recruits.actualMOS,
        recruiterId: recruits.recruiterId,
        recruiterName: users.fullName,
        recruiterEmail: users.email,
        stationId: users.stationId,
      })
      .from(recruits)
      .leftJoin(users, eq(recruits.recruiterId, users.id))
      .where(
        and(
          sql`${recruits.shipDate} >= ${todayStr}::date`,
          sql`${recruits.shipDate} <= ${threeDaysStr}::date`,
          eq(recruits.shipNotificationSent, false)
        )
      );
    
    console.log(`📦 Found ${upcomingShippers.length} upcoming shippers`);
    
    for (const shipper of upcomingShippers) {
      try {
        // Get all users in the same station (station commanders and admin)
        const stationUsers = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.stationId, shipper.stationId),
              sql`${users.role} IN ('station_commander', 'admin')`
            )
          );
        
        // Also notify the recruiter
        if (shipper.recruiterId) {
          const [recruiter] = await db
            .select()
            .from(users)
            .where(eq(users.id, shipper.recruiterId));
          
          if (recruiter) {
            stationUsers.push(recruiter);
          }
        }
        
        const daysUntilShip = Math.ceil(
          (new Date(shipper.shipDate as any).getTime() - today.getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        
        const message = `${shipper.recruitName} is shipping to basic training in ${daysUntilShip} day${daysUntilShip !== 1 ? 's' : ''} (${new Date(shipper.shipDate as any).toLocaleDateString()})`;
        
        // Send notifications to all relevant users
        for (const user of stationUsers) {
          // Create in-app notification
          await db.insert(notifications).values({
            userId: user.id,
            type: 'shipper_alert',
            title: '🚢 Upcoming Shipper Alert',
            message,
            link: '/shippers',
            read: false,
          });
          
          // Send email notification
          try {
            await transporter.sendMail({
              from: `Army Recruiter Tool <${process.env.SMTP_USER || 'alex.cybitdevs@gmail.com'}>`,
              to: user.email,
              subject: `🚢 Shipper Alert: ${shipper.recruitName} ships in ${daysUntilShip} days`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #006400;">🚢 Upcoming Shipper Alert</h2>
                  <p><strong>${shipper.recruitName}</strong> is scheduled to ship to basic training soon.</p>
                  
                  <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #006400; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Ship Date:</strong> ${new Date(shipper.shipDate as any).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p style="margin: 5px 0;"><strong>Days Until Ship:</strong> ${daysUntilShip} day${daysUntilShip !== 1 ? 's' : ''}</p>
                    <p style="margin: 5px 0;"><strong>Component:</strong> ${shipper.component || 'Not specified'}</p>
                    <p style="margin: 5px 0;"><strong>MOS:</strong> ${shipper.actualMOS || shipper.component || 'Not assigned'}</p>
                    <p style="margin: 5px 0;"><strong>Recruiter:</strong> ${shipper.recruiterName}</p>
                  </div>
                  
                  <p>
                    <a href="${process.env.APP_URL || 'https://armyrecruitertool.duckdns.org'}/shippers" 
                       style="background-color: #006400; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                      View All Shippers
                    </a>
                  </p>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                  <p style="color: #666; font-size: 12px;">
                    <strong>UNCLASSIFIED</strong><br>
                    Army Recruiter Tool - For Official Use Only (FOUO)<br>
                    Developed by SGT Alex Moran - CyBit Devs
                  </p>
                </div>
              `,
            });
            
            console.log(`✅ Email sent to ${user.email} for ${shipper.recruitName}`);
          } catch (emailError) {
            console.error(`❌ Failed to send email to ${user.email}:`, emailError);
          }
        }
        
        // Mark notification as sent
        await db
          .update(recruits)
          .set({ shipNotificationSent: true })
          .where(eq(recruits.id, shipper.recruitId));
        
        console.log(`✅ Notifications sent for ${shipper.recruitName}`);
      } catch (error) {
        console.error(`❌ Error processing shipper ${shipper.recruitName}:`, error);
      }
    }
    
    console.log('✅ Shipper notification check complete');
  } catch (error) {
    console.error('❌ Error checking upcoming shippers:', error);
    throw error;
  }
}

// Only run standalone if this is the main module being executed directly
// This won't trigger when imported by index.ts
const isMainModule = process.argv[1] && process.argv[1].endsWith('shipper-notifications.ts');
if (isMainModule) {
  console.log('🚀 Running shipper notification check standalone...');
  checkUpcomingShippers()
    .then(() => {
      console.log('✅ Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}
