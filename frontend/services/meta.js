import api from './api';

const FALLBACK_UNITS = ['pcs', 'pack', 'kg', 'g', 'l', 'ml'];
const FALLBACK_CATEGORIES = [
  'Soft Drinks & Water',
  'Cleaning & Hygiene',
  'Equipment Supplies',
  'Coffee',
  'Tea',
];

export async function getUnits() {
  try {
    const { data } = await api.get('/meta/units');
    if (Array.isArray(data) && data.length) return data;
  } catch (e) {
    console.warn('getUnits fallback:', e?.message || e);
  }
  return FALLBACK_UNITS;
}

export async function getCategories() {
  try {
    const { data } = await api.get('/meta/categories');
    if (Array.isArray(data) && data.length) return data;
  } catch (e) {
    console.warn('getCategories fallback:', e?.message || e);
  }
  return FALLBACK_CATEGORIES;
}