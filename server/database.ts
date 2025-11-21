import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../shared/schema';

// PostgreSQL connection
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://armyrecruiter:password@localhost:5432/army_recruiter';

console.log('🔌 Database configuration:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('  - Connection string:', DATABASE_URL.replace(/:[^:@]*@/, ':****@')); // Hide password

const pool = new Pool({
  connectionString: DATABASE_URL,
  // SSL is disabled for internal Kubernetes cluster connections
  // The database service is within the same private network
  ssl: false,
  // Connection pool optimization for better performance under load
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
});

// Test connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

// Test connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

