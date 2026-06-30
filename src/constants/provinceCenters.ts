export const PROVINCE_CENTERS: Record<number, [number, number]> = {
  1: [21.0283334, 105.854041], // Hà Nội
  4: [22.7426936, 106.1060926], // Cao Bằng
  8: [22.3382057, 105.0715846], // Tuyên Quang
  11: [21.6546566, 103.2168632], // Điện Biên
  12: [22.2921668, 103.1798662], // Lai Châu
  14: [21.2276769, 104.1575944], // Sơn La
  15: [22.3069302, 104.1829592], // Lào Cai
  19: [21.9610968, 105.8440789], // Yên Bái
  20: [21.8487579, 106.6140692], // Lạng Sơn
  22: [21.1718046, 107.2012742], // Quảng Ninh
  24: [21.3282166, 106.4625257], // Bắc Giang
  25: [21.3007538, 105.1349604], // Phú Thọ
  31: [20.8830967, 106.6790381], // Hải Phòng
  33: [20.6065846, 106.2843471], // Hưng Yên
  37: [20.2572874, 105.971931], // Ninh Bình
  38: [19.9781573, 105.4816107], // Thanh Hóa
  40: [19.1976001, 105.060676], // Nghệ An
  42: [18.3504832, 105.7623047], // Hà Tĩnh
  44: [17.2166964, 106.9548246], // Quảng Bình
  46: [16.4639321, 107.5863388], // Thừa Thiên Huế
  48: [16.068, 108.212], // Đà Nẵng
  51: [14.9953739, 108.691729], // Quảng Ngãi
  52: [14.0201373, 108.6354524], // Gia Lai
  56: [12.2980751, 108.9950386], // Khánh Hòa
  66: [12.8741856, 108.7979302], // Đắk Lắk
  68: [11.6614957, 108.1335279], // Lâm Đồng
  75: [10.9182878, 106.8481538], // Đồng Nai
  79: [10.7737261, 106.7166008], // TP. Hồ Chí Minh
  80: [11.0800527, 106.2610531], // Tây Ninh
  82: [10.425183, 105.9271362], // Tiền Giang
  86: [10.046765, 106.2947443], // Bến Tre
  91: [10.3188672, 105.0432488], // An Giang
  92: [10.0362046, 105.7872656], // Cần Thơ
  96: [9.0180177, 105.0869724], // Cà Mau
};

export const getProvinceCenterByCode = (
  code: number | undefined,
  name?: string
): [number, number] => {
  if (code && PROVINCE_CENTERS[code]) {
    return PROVINCE_CENTERS[code];
  }
  // Fallback to name match
  if (!name) return [10.7737261, 106.7166008]; // Default HCMC
  const n = name.toLowerCase();
  if (n.includes('đà nẵng')) return [16.068, 108.212];
  if (n.includes('quảng nam')) return [15.567, 108.15];
  if (n.includes('huế') || n.includes('thừa thiên')) return [16.4639321, 107.5863388];
  if (n.includes('hà nội')) return [21.0283334, 105.854041];
  if (n.includes('hồ chí minh') || n.includes('sài gòn')) return [10.7737261, 106.7166008];
  if (n.includes('đồng nai')) return [10.9182878, 106.8481538];
  return [10.7737261, 106.7166008]; // Default HCMC
};
