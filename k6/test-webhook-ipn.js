import { VNPay } from 'vnpay';
import { HashAlgorithm, ProductCode, VnpLocale } from 'vnpay/enums';

const totalRequests = 5;
const url = 'http://localhost:3005/api/payments/webhook';

const vnpay = new VNPay({
  tmnCode: '6IU5D5GL',
  secureSecret: 'RDCWARZAEMLVXOIDDNVJUDWEZJZCEYFQ',
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  hashAlgorithm: HashAlgorithm.SHA512,
});

// THAY PROVIDER TRANSACTION ID VÀ AMOUNT KHỚP VỚI BẢNG PAYMENTS TRONG DB
const providerTransactionId = 'TXN_1792659542698_223';
const amountInVnd = 1500000;

const mockParams = {
  vnp_Amount: amountInVnd,
  vnp_IpAddr: '127.0.0.1',
  vnp_TxnRef: providerTransactionId,
  vnp_OrderInfo: 'Thanh toan don hang',
  vnp_OrderType: ProductCode.Other,
  vnp_ReturnUrl: 'http://localhost:3005/api/payments/vnpay-return',
  vnp_Locale: VnpLocale.VN,
  vnp_ResponseCode: '24',
  vnp_TransactionNo: '14043720',
  vnp_TransactionStatus: '02',
};

const generatedPaymentUrl = vnpay.buildPaymentUrl(mockParams);
const queryString = generatedPaymentUrl.split('?')[1];

async function sendWebhook(index) {
  try {
    const response = await fetch(`${url}?${queryString}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return { reqId: index, status: response.status, data };
  } catch (err) {
    return { reqId: index, status: 'ERROR', error: err.message };
  }
}

async function runTest() {
  console.log(
    `🚀 Bắt đầu gửi đồng thời ${totalRequests} Webhook IPN trùng lặp...`,
  );

  const promises = [];
  for (let i = 1; i <= totalRequests; i++) {
    promises.push(sendWebhook(i));
  }

  const results = await Promise.all(promises);

  console.log('\n📊 KẾT QUẢ XỬ LÝ IDEMPOTENCY WEBHOOK:');
  results.forEach((r) => {
    if (r.status === 'ERROR') {
      console.log(`Req #${r.reqId} | ❌ LỖI KẾT NỐI:`, r.error);
    } else {
      console.log(
        `Req #${r.reqId} | HTTP Status: ${r.status} | Response:`,
        r.data,
      );
    }
  });
}

runTest();
