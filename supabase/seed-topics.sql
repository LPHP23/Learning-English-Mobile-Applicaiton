-- VocaBoost: 3 chủ đề có sẵn + 10 từ/chủ đề (chạy sau schema.sql)
-- Chạy file này để dùng app ngay KHÔNG cần AI API
-- LƯU Ý: Nếu bật topics theo từng user, hãy gán user_id sau khi seed:
-- update topics set user_id = '<YOUR_USER_ID>' where user_id is null;

-- Hospital
insert into topics (id, name, emoji, description, total_words, cefr_level)
values (
  'a0000001-0000-4000-8000-000000000001',
  'Hospital', '🏥', 'Từ vựng y tế và bệnh viện', 10, 'B1'
);

insert into words (topic_id, word, ipa, part_of_speech, cefr_level, cefr_order, vietnamese_meaning, example_sentence) values
('a0000001-0000-4000-8000-000000000001', 'hospital', '/ˈhɒs.pɪ.tl̩/', 'n', 'A2', 1, 'bệnh viện', 'She works at the city hospital.'),
('a0000001-0000-4000-8000-000000000001', 'doctor', '/ˈdɒk.tər/', 'n', 'A1', 2, 'bác sĩ', 'The doctor examined the patient.'),
('a0000001-0000-4000-8000-000000000001', 'nurse', '/nɜːs/', 'n', 'A2', 3, 'y tá', 'The nurse gave him medicine.'),
('a0000001-0000-4000-8000-000000000001', 'patient', '/ˈpeɪ.ʃənt/', 'n', 'B1', 4, 'bệnh nhân', 'The patient is recovering well.'),
('a0000001-0000-4000-8000-000000000001', 'fever', '/ˈfiː.vər/', 'n', 'A2', 5, 'sốt', 'He has a high fever.'),
('a0000001-0000-4000-8000-000000000001', 'medicine', '/ˈmed.ɪ.sən/', 'n', 'A2', 6, 'thuốc', 'Take this medicine twice a day.'),
('a0000001-0000-4000-8000-000000000001', 'ambulance', '/ˈæm.bjə.ləns/', 'n', 'B1', 7, 'xe cứu thương', 'Call an ambulance immediately.'),
('a0000001-0000-4000-8000-000000000001', 'emergency', '/ɪˈmɜː.dʒən.si/', 'n', 'B1', 8, 'cấp cứu', 'This is a medical emergency.'),
('a0000001-0000-4000-8000-000000000001', 'prescription', '/prɪˈskrɪp.ʃən/', 'n', 'B2', 9, 'đơn thuốc', 'The doctor wrote a prescription.'),
('a0000001-0000-4000-8000-000000000001', 'surgery', '/ˈsɜː.dʒər.i/', 'n', 'B2', 10, 'phẫu thuật', 'He needs surgery on his knee.');

-- Airport
insert into topics (id, name, emoji, description, total_words, cefr_level)
values (
  'a0000002-0000-4000-8000-000000000002',
  'Airport', '✈️', 'Từ vựng sân bay và du lịch', 10, 'A2'
);

insert into words (topic_id, word, ipa, part_of_speech, cefr_level, cefr_order, vietnamese_meaning, example_sentence) values
('a0000002-0000-4000-8000-000000000002', 'airport', '/ˈeə.pɔːt/', 'n', 'A2', 1, 'sân bay', 'We arrived at the airport early.'),
('a0000002-0000-4000-8000-000000000002', 'passport', '/ˈpɑːs.pɔːt/', 'n', 'A2', 2, 'hộ chiếu', 'Show your passport at check-in.'),
('a0000002-0000-4000-8000-000000000002', 'luggage', '/ˈlʌɡ.ɪdʒ/', 'n', 'B1', 3, 'hành lý', 'My luggage was lost.'),
('a0000002-0000-4000-8000-000000000002', 'flight', '/flaɪt/', 'n', 'A2', 4, 'chuyến bay', 'Our flight was delayed.'),
('a0000002-0000-4000-8000-000000000002', 'boarding pass', '/ˈbɔː.dɪŋ pɑːs/', 'n', 'B1', 5, 'thẻ lên máy bay', 'Have your boarding pass ready.'),
('a0000002-0000-4000-8000-000000000002', 'customs', '/ˈkʌs.təmz/', 'n', 'B1', 6, 'hải quan', 'We went through customs quickly.'),
('a0000002-0000-4000-8000-000000000002', 'departure', '/dɪˈpɑː.tʃər/', 'n', 'B1', 7, 'khởi hành', 'Departure is at gate 12.'),
('a0000002-0000-4000-8000-000000000002', 'arrival', '/əˈraɪ.vəl/', 'n', 'B1', 8, 'đến nơi', 'The arrival time is 3 PM.'),
('a0000002-0000-4000-8000-000000000002', 'security', '/sɪˈkjʊə.rə.ti/', 'n', 'B1', 9, 'an ninh', 'Go through security screening.'),
('a0000002-0000-4000-8000-000000000002', 'check-in', '/ˈtʃek ɪn/', 'n', 'A2', 10, 'làm thủ tục', 'Online check-in saves time.');

-- Restaurant
insert into topics (id, name, emoji, description, total_words, cefr_level)
values (
  'a0000003-0000-4000-8000-000000000003',
  'Restaurant', '🍽️', 'Từ vựng nhà hàng và ẩm thực', 10, 'A2'
);

insert into words (topic_id, word, ipa, part_of_speech, cefr_level, cefr_order, vietnamese_meaning, example_sentence) values
('a0000003-0000-4000-8000-000000000003', 'restaurant', '/ˈres.tər.ɒnt/', 'n', 'A2', 1, 'nhà hàng', 'We booked a table at the restaurant.'),
('a0000003-0000-4000-8000-000000000003', 'menu', '/ˈmen.juː/', 'n', 'A1', 2, 'thực đơn', 'Can I see the menu, please?'),
('a0000003-0000-4000-8000-000000000003', 'waiter', '/ˈweɪ.tər/', 'n', 'A2', 3, 'bồi bàn', 'The waiter took our order.'),
('a0000003-0000-4000-8000-000000000003', 'bill', '/bɪl/', 'n', 'A2', 4, 'hóa đơn', 'Could we have the bill, please?'),
('a0000003-0000-4000-8000-000000000003', 'reservation', '/ˌrez.əˈveɪ.ʃən/', 'n', 'B1', 5, 'đặt bàn', 'I made a reservation for two.'),
('a0000003-0000-4000-8000-000000000003', 'appetizer', '/ˈæp.ɪ.taɪ.zər/', 'n', 'B2', 6, 'khai vị', 'We ordered an appetizer.'),
('a0000003-0000-4000-8000-000000000003', 'dessert', '/dɪˈzɜːt/', 'n', 'A2', 7, 'tráng miệng', 'What desserts do you have?'),
('a0000003-0000-4000-8000-000000000003', 'spicy', '/ˈspaɪ.si/', 'adj', 'A2', 8, 'cay', 'This dish is too spicy for me.'),
('a0000003-0000-4000-8000-000000000003', 'delicious', '/dɪˈlɪʃ.əs/', 'adj', 'A2', 9, 'ngon', 'The food was delicious.'),
('a0000003-0000-4000-8000-000000000003', 'tip', '/tɪp/', 'n', 'B1', 10, 'tiền boa', 'We left a 15% tip.');
