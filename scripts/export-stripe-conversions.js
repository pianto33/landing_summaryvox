/**
 * Script para exportar suscripciones de Stripe con gclid
 * para subir como conversiones offline a Google Ads
 * 
 * Uso:
 *   node scripts/export-stripe-conversions.js
 * 
 * Requiere:
 *   - STRIPE_PRIVATE_KEY en .env.local o como variable de entorno
 */

const Stripe = require('stripe').default;
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno (prod primero para usar las keys LIVE)
require('dotenv').config({ path: path.join(__dirname, '../.env.prod'), override: true });
require('dotenv').config({ path: path.join(__dirname, '../.env.local'), override: true });

const STRIPE_PRIVATE_KEY = process.env.STRIPE_PRIVATE_KEY || process.env.STRIPE_SECRET_KEY || '';

if (!STRIPE_PRIVATE_KEY) {
  console.error('❌ Error: STRIPE_PRIVATE_KEY no está configurada');
  console.error('   Configura la variable en .env.local o pásala como variable de entorno');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_PRIVATE_KEY);

async function getAllSubscriptionsWithGclid() {
  const conversions = [];
  let hasMore = true;
  let startingAfter = undefined;
  let totalProcessed = 0;

  console.log('🔍 Buscando suscripciones en Stripe...\n');

  while (hasMore) {
    const params = {
      limit: 100,
      expand: ['data.customer'],
    };

    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const subscriptions = await stripe.subscriptions.list(params);
    
    for (const subscription of subscriptions.data) {
      totalProcessed++;
      
      // Verificar si tiene gclid en metadata
      const gclid = subscription.metadata?.gclid;
      
      if (gclid) {
        const customer = subscription.customer;
        
        // Obtener el valor de la suscripción
        const item = subscription.items.data[0];
        const amount = item?.price?.unit_amount || 0;
        const currency = item?.price?.currency || 'eur';
        
        conversions.push({
          gclid,
          email: customer.email || 'unknown',
          customerId: customer.id,
          subscriptionId: subscription.id,
          conversionTime: new Date(subscription.created * 1000).toISOString(),
          conversionValue: amount / 100, // Convertir de centavos a unidades
          currency: currency.toUpperCase(),
          status: subscription.status,
        });
        
        console.log(`  ✅ ${customer.email} - ${gclid.substring(0, 30)}...`);
      }
    }

    hasMore = subscriptions.has_more;
    if (subscriptions.data.length > 0) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
    }
  }

  console.log(`\n📊 Procesadas ${totalProcessed} suscripciones, ${conversions.length} con gclid`);
  
  return conversions;
}

function generateGoogleAdsCSV(conversions) {
  // Formato CSV para Google Ads Offline Conversions
  // https://support.google.com/google-ads/answer/7014069
  
  // Sin valor - usa el valor por defecto configurado en Google Ads ($15)
  const headers = [
    'Google Click ID',
    'Conversion Name',
    'Conversion Time',
  ];
  
  const rows = conversions.map(conv => [
    conv.gclid,
    'offline', // Nombre de la conversión en Google Ads
    conv.conversionTime,
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  return csvContent;
}

function generateJSON(conversions) {
  return JSON.stringify(conversions, null, 2);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Exportador de Conversiones Stripe → Google Ads');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    const conversions = await getAllSubscriptionsWithGclid();
    
    if (conversions.length === 0) {
      console.log('\n⚠️  No se encontraron suscripciones con gclid');
      return;
    }

    // Crear directorio de salida
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generar timestamp para los archivos
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

    // Guardar CSV para Google Ads
    const csvPath = path.join(outputDir, `google-ads-conversions-${timestamp}.csv`);
    fs.writeFileSync(csvPath, generateGoogleAdsCSV(conversions));
    console.log(`\n📄 CSV para Google Ads: ${csvPath}`);

    // Guardar JSON con todos los datos
    const jsonPath = path.join(outputDir, `stripe-conversions-${timestamp}.json`);
    fs.writeFileSync(jsonPath, generateJSON(conversions));
    console.log(`📄 JSON completo: ${jsonPath}`);

    // Resumen
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  RESUMEN');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Total conversiones con gclid: ${conversions.length}`);
    console.log(`  Valor total: ${conversions.reduce((sum, c) => sum + c.conversionValue, 0).toFixed(2)} EUR`);
    console.log('\n  Estados:');
    
    const statusCount = {};
    conversions.forEach(c => {
      statusCount[c.status] = (statusCount[c.status] || 0) + 1;
    });
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`    - ${status}: ${count}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  PRÓXIMOS PASOS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  1. Ve a Google Ads → Herramientas → Conversiones');
    console.log('  2. Selecciona tu conversión "YQH - Registro - Thanks"');
    console.log('  3. Click en "Subir conversiones offline"');
    console.log('  4. Sube el archivo CSV generado');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
