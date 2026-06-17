require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const aiData = require('../ai.json');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl) {
  console.error('SUPABASE_URL environment variable is required');
  process.exit(1);
}
if (!supabaseKey) {
  console.error('SUPABASE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initDB() {
  const { error } = await supabase.from('agents').select('*', { count: 'exact', head: true });
  if (error && error.code === '42P01') {
    console.log('agents table does not exist.');
    console.log('Run this SQL in Supabase SQL Editor:');
    console.log('  CREATE TABLE agents (name TEXT PRIMARY KEY, great TEXT NOT NULL);');
    console.log('  ALTER TABLE agents ENABLE ROW LEVEL SECURITY;');
    console.log('  CREATE POLICY "anon_all" ON agents FOR ALL USING (true) WITH CHECK (true);');
  }
}

async function seedDB() {
  const { count } = await supabase.from('agents').select('*', { count: 'exact', head: true });
  if (count > 0) {
    console.log(`DB already has ${count} agents, skipping seed`);
    return;
  }
  for (const agent of aiData) {
    await supabase
      .from('agents')
      .upsert({ name: agent.이름, great: agent.장점 }, { onConflict: 'name' })
      .select();
  }
  console.log(`Seeded ${aiData.length} agents`);
}

async function getAllAgents() {
  const { data, error } = await supabase.from('agents').select('*');
  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return data || [];
}

async function addAgent(name, great) {
  const { error } = await supabase.from('agents').upsert({ name, great }, { onConflict: 'name' });
  if (error) throw error;
}

async function deleteAgent(name) {
  const { error } = await supabase.from('agents').delete().eq('name', name);
  if (error) throw error;
}

module.exports = { supabase, initDB, seedDB, getAllAgents, addAgent, deleteAgent };
