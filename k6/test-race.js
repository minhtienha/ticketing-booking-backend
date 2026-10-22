const totalRequests = 100;
const url = 'http://localhost:3003/api/reservations';

// Thay đổi token
const authToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MTBmYzA4NS1jZjdiLTRmMjctOWVhZC05OWI4YzdmZDUzMWIiLCJlbWFpbCI6InRpZW5AZ21haWwuY29tIiwiaWF0IjoxNzkyNjU5NDk1LCJleHAiOjE3OTI2NjAzOTV9.ZjR-OoT5xUwYGAsSncSGd6I3orQGUki1KrOA17EeRVA';

// Thay đổi thông tin payload
const payload = {
  eventId: 'b8e31464-eb3b-4638-b663-e53a6da46304',
  ticketTierId: '3e1f5d91-db17-4247-ac47-e5974905aa49',
  quantity: 1,
};

async function sendRequest(userId) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
    return { status: response.status, data: await response.json() };
  } catch (err) {
    return { status: 'ERROR', error: err.message };
  }
}

async function runTest() {
  console.log(`🚀 Đang gửi đồng thời ${totalRequests} requests...`);

  const promises = [];
  for (let i = 1; i <= totalRequests; i++) {
    promises.push(sendRequest(i));
  }

  const results = await Promise.all(promises);

  const success = results.filter(
    (r) => r.status === 201 || r.status === 200,
  ).length;
  const failed = results.filter((r) => r.status === 400).length;
  const unauthorized = results.filter((r) => r.status === 401).length;
  const errors = results.filter(
    (r) => r.status === 'ERROR' || r.status >= 500,
  ).length;

  console.log('\n📊 KẾT QUẢ TEST CONCURRENCY:');
  console.log(`✅ Thành công (200/201): ${success}`);
  console.log(`❌ Hết vé / Từ chối (400): ${failed}`);
  console.log(`🔒 Chưa xác thực (401): ${unauthorized}`);
  console.log(`⚠️ Lỗi hệ thống (500/Err): ${errors}`);
}

runTest();
