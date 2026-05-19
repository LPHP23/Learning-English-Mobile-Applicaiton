-- VocaBoost: Dữ liệu từ điển mẫu (chạy trong Supabase SQL Editor)
-- Sau khi chạy schema.sql, chạy file này để tra từ hoạt động ngay cả khi offline API

insert into vietphrase (word, ipa, part_of_speech, vietnamese_meaning, example_sentence, cefr_level, topics) values
-- Hospital
('hospital', '/ˈhɒs.pɪ.tl̩/', 'n', 'bệnh viện', 'She works at the city hospital.', 'A2', array['hospital']),
('doctor', '/ˈdɒk.tər/', 'n', 'bác sĩ', 'The doctor examined the patient.', 'A1', array['hospital']),
('nurse', '/nɜːs/', 'n', 'y tá', 'The nurse gave him medicine.', 'A2', array['hospital']),
('patient', '/ˈpeɪ.ʃənt/', 'n', 'bệnh nhân', 'The patient is recovering well.', 'B1', array['hospital']),
('fever', '/ˈfiː.vər/', 'n', 'sốt', 'He has a high fever.', 'A2', array['hospital']),
('medicine', '/ˈmed.ɪ.sən/', 'n', 'thuốc', 'Take this medicine twice a day.', 'A2', array['hospital']),
('ambulance', '/ˈæm.bjə.ləns/', 'n', 'xe cứu thương', 'Call an ambulance immediately.', 'B1', array['hospital']),
('surgery', '/ˈsɜː.dʒər.i/', 'n', 'phẫu thuật', 'He needs surgery on his knee.', 'B2', array['hospital']),
('prescription', '/prɪˈskrɪp.ʃən/', 'n', 'đơn thuốc', 'The doctor wrote a prescription.', 'B2', array['hospital']),
('emergency', '/ɪˈmɜː.dʒən.si/', 'n', 'cấp cứu', 'This is a medical emergency.', 'B1', array['hospital']),
-- Airport
('airport', '/ˈeə.pɔːt/', 'n', 'sân bay', 'We arrived at the airport early.', 'A2', array['airport']),
('passport', '/ˈpɑːs.pɔːt/', 'n', 'hộ chiếu', 'Show your passport at check-in.', 'A2', array['airport']),
('luggage', '/ˈlʌɡ.ɪdʒ/', 'n', 'hành lý', 'My luggage was lost.', 'B1', array['airport']),
('boarding pass', '/ˈbɔː.dɪŋ pɑːs/', 'n', 'thẻ lên máy bay', 'Have your boarding pass ready.', 'B1', array['airport']),
('flight', '/flaɪt/', 'n', 'chuyến bay', 'Our flight was delayed.', 'A2', array['airport']),
('customs', '/ˈkʌs.təmz/', 'n', 'hải quan', 'We went through customs quickly.', 'B1', array['airport']),
('departure', '/dɪˈpɑː.tʃər/', 'n', 'khởi hành', 'Departure is at gate 12.', 'B1', array['airport']),
('arrival', '/əˈraɪ.vəl/', 'n', 'đến nơi', 'The arrival time is 3 PM.', 'B1', array['airport']),
('check-in', '/ˈtʃek ɪn/', 'n', 'làm thủ tục', 'Online check-in saves time.', 'A2', array['airport']),
('security', '/sɪˈkjʊə.rə.ti/', 'n', 'an ninh', 'Go through security screening.', 'B1', array['airport']),
-- Restaurant
('restaurant', '/ˈres.tər.ɒnt/', 'n', 'nhà hàng', 'We booked a table at the restaurant.', 'A2', array['restaurant']),
('menu', '/ˈmen.juː/', 'n', 'thực đơn', 'Can I see the menu, please?', 'A1', array['restaurant']),
('waiter', '/ˈweɪ.tər/', 'n', 'bồi bàn (nam)', 'The waiter took our order.', 'A2', array['restaurant']),
('bill', '/bɪl/', 'n', 'hóa đơn', 'Could we have the bill, please?', 'A2', array['restaurant']),
('tip', '/tɪp/', 'n', 'tiền boa', 'We left a 15% tip.', 'B1', array['restaurant']),
('reservation', '/ˌrez.əˈveɪ.ʃən/', 'n', 'đặt bàn', 'I made a reservation for two.', 'B1', array['restaurant']),
('appetizer', '/ˈæp.ɪ.taɪ.zər/', 'n', 'khai vị', 'We ordered an appetizer.', 'B2', array['restaurant']),
('dessert', '/dɪˈzɜːt/', 'n', 'tráng miệng', 'What desserts do you have?', 'A2', array['restaurant']),
('spicy', '/ˈspaɪ.si/', 'adj', 'cay', 'This dish is too spicy for me.', 'A2', array['restaurant']),
('delicious', '/dɪˈlɪʃ.əs/', 'adj', 'ngon', 'The food was delicious.', 'A2', array['restaurant']);
