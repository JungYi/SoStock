const meta = {
  units: ['pcs', 'pack', 'kg', 'g', 'l', 'ml'], // 처음은 이렇게 시작
  integerUnits: ['pcs', 'pack', 'ea', 'bag'], // ← 정수 단위만 별도 보관
  categories: [
    'Soft Drinks & Water',
    'Cleaning & Hygiene',
    'Equipment Supplies',
    'Coffee',
    'Tea',
  ],
};
const getMeta = () => meta; // 훗날 DB에서 읽도록 교체

module.exports = { getMeta };