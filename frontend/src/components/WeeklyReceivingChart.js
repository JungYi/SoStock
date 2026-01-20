import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

/**
 * WeeklyReceivingChart
 * - props.receipts: [{ receivedAt, items: [{ quantity, ... }], ... }]
 * - 최근 7일(오늘 포함) 날짜별 총 입고 수량 합계를 막대차트로 표시
 */
const normalizeDateKey = (d) => {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD
};

const getLast7Days = () => {
  const out = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(d);
  }
  return out;
};

const sumQty = (items) =>
  (Array.isArray(items) ? items : []).reduce(
    (acc, it) => acc + Number(it?.quantity || 0),
    0,
  );

const WeeklyReceivingChart = ({ receipts }) => {
  // 1) 날짜별 합계 맵
  const map = new Map();
  (Array.isArray(receipts) ? receipts : []).forEach((r) => {
    const key = normalizeDateKey(r.receivedAt || r.createdAt || Date.now());
    const prev = map.get(key) || 0;
    map.set(key, prev + sumQty(r.items));
  });

  // 2) 최근 7일 기준으로 데이터 어레이 만들기(없는 날은 0)
  const days = getLast7Days();
  const data = days.map((d) => {
    const key = normalizeDateKey(d);
    return {
      day: `${d.getMonth() + 1}/${d.getDate()}`,
      qty: map.get(key) || 0,
    };
  });

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-3">Receiving (Last 7 days)</h2>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="qty" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

WeeklyReceivingChart.propTypes = {
  receipts: PropTypes.arrayOf(PropTypes.shape({
    receivedAt: PropTypes.string,
    createdAt: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
      quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })),
  })),
};

WeeklyReceivingChart.defaultProps = {
  receipts: [],
};

export default WeeklyReceivingChart;