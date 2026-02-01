#!/usr/bin/env node
/**
 * Test Database Connection Script
 * 
 * Testuje połączenie z produkcyjną bazą danych Supabase
 * 
 * Użycie: node scripts/test-db-connection.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testowanie połączenia z bazą Supabase...\n');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : '❌ BRAK');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ BŁĄD: Brak zmiennych środowiskowych!');
  console.error('');
  console.error('Upewnij się że masz plik .env z:');
  console.error('  SUPABASE_URL=...');
  console.error('  SUPABASE_KEY=...');
  console.error('');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Sprawdź czy tabele istnieją
    console.log('📋 Test 1: Sprawdzanie struktury bazy...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('flashcards')
      .select('id')
      .limit(1);
    
    if (tablesError) {
      if (tablesError.code === '42P01') {
        console.log('⚠️  Tabela "flashcards" nie istnieje - musisz uruchomić migracje!');
        console.log('');
        console.log('Uruchom migracje przez:');
        console.log('  npx supabase db push');
        console.log('');
        return false;
      } else {
        throw tablesError;
      }
    }
    
    console.log('✅ Tabela "flashcards" istnieje');
    
    // Test 2: Sprawdź tabelę generations
    const { error: genError } = await supabase
      .from('generations')
      .select('id')
      .limit(1);
    
    if (genError && genError.code === '42P01') {
      console.log('⚠️  Tabela "generations" nie istnieje');
      return false;
    }
    
    console.log('✅ Tabela "generations" istnieje');
    
    // Test 3: Sprawdź tabelę generation_error_logs
    const { error: errLogError } = await supabase
      .from('generation_error_logs')
      .select('id')
      .limit(1);
    
    if (errLogError && errLogError.code === '42P01') {
      console.log('⚠️  Tabela "generation_error_logs" nie istnieje');
      return false;
    }
    
    console.log('✅ Tabela "generation_error_logs" istnieje');
    console.log('');
    
    // Test 4: Statystyki
    console.log('📊 Statystyki bazy:');
    
    const { count: flashcardsCount } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true });
    
    const { count: generationsCount } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   - Flashcards: ${flashcardsCount || 0}`);
    console.log(`   - Generations: ${generationsCount || 0}`);
    console.log('');
    
    console.log('✅ Wszystkie testy przeszły pomyślnie!');
    console.log('🎉 Baza danych jest gotowa do użycia!');
    console.log('');
    
    return true;
    
  } catch (error) {
    console.error('❌ Błąd podczas testowania połączenia:');
    console.error('');
    console.error(error);
    console.error('');
    console.error('Sprawdź:');
    console.error('  1. Czy SUPABASE_URL jest poprawny');
    console.error('  2. Czy SUPABASE_KEY jest poprawny');
    console.error('  3. Czy masz dostęp do internetu');
    console.error('  4. Czy projekt Supabase jest aktywny');
    console.error('');
    return false;
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
