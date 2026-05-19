/**
 * Từ vựng có sẵn khi chưa deploy Claude / Edge Functions.
 * Dùng làm fallback trong topic-select và demo offline.
 */
export interface BuiltinWord {
  word: string;
  ipa: string;
  part_of_speech: string;
  cefr_level: string;
  cefr_order: number;
  vietnamese_meaning: string;
  example_sentence: string;
}

export interface BuiltinTopic {
  name: string;
  emoji: string;
  description: string;
  cefr_level: string;
  words: BuiltinWord[];
}

export const BUILTIN_TOPICS: BuiltinTopic[] = [
  {
    name: 'Hospital',
    emoji: '🏥',
    description: 'Từ vựng y tế và bệnh viện',
    cefr_level: 'B1',
    words: [
      { word: 'hospital', ipa: '/ˈhɒs.pɪ.tl̩/', part_of_speech: 'n', cefr_level: 'A2', cefr_order: 1, vietnamese_meaning: 'bệnh viện', example_sentence: 'She works at the city hospital.' },
      { word: 'doctor', ipa: '/ˈdɒk.tər/', part_of_speech: 'n', cefr_level: 'A1', cefr_order: 2, vietnamese_meaning: 'bác sĩ', example_sentence: 'The doctor examined the patient.' },
      { word: 'nurse', ipa: '/nɜːs/', part_of_speech: 'n', cefr_level: 'A2', cefr_order: 3, vietnamese_meaning: 'y tá', example_sentence: 'The nurse gave him medicine.' },
      { word: 'patient', ipa: '/ˈpeɪ.ʃənt/', part_of_speech: 'n', cefr_level: 'B1', cefr_order: 4, vietnamese_meaning: 'bệnh nhân', example_sentence: 'The patient is recovering well.' },
      { word: 'fever', ipa: '/ˈfiː.vər/', part_of_speech: 'n', cefr_level: 'A2', cefr_order: 5, vietnamese_meaning: 'sốt', example_sentence: 'He has a high fever.' },
      { word: 'medicine', ipa: '/ˈmed.ɪ.sən/', part_of_speech: 'n', cefr_level: 'A2', cefr_order: 6, vietnamese_meaning: 'thuốc', example_sentence: 'Take this medicine twice a day.' },
      { word: 'ambulance', ipa: '/ˈæm.bjə.ləns/', part_of_speech: 'n', cefr_level: 'B1', cefr_order: 7, vietnamese_meaning: 'xe cứu thương', example_sentence: 'Call an ambulance immediately.' },
      { word: 'emergency', ipa: '/ɪˈmɜː.dʒən.si/', part_of_speech: 'n', cefr_level: 'B1', cefr_order: 8, vietnamese_meaning: 'cấp cứu', example_sentence: 'This is a medical emergency.' },
      { word: 'prescription', ipa: '/prɪˈskrɪp.ʃən/', part_of_speech: 'n', cefr_level: 'B2', cefr_order: 9, vietnamese_meaning: 'đơn thuốc', example_sentence: 'The doctor wrote a prescription.' },
      { word: 'surgery', ipa: '/ˈsɜː.dʒər.i/', part_of_speech: 'n', cefr_level: 'B2', cefr_order: 10, vietnamese_meaning: 'phẫu thuật', example_sentence: 'He needs surgery on his knee.' },
    ],
  },
  {
    name: 'Airport',
    emoji: '✈️',
    description: 'Từ vựng sân bay và du lịch',
    cefr_level: 'A2',
    words: [
      { word: 'airport', ipa: '/ˈeə.pɔːt/', part_of_speech: 'n', cefr_level: 'A2', cefr_order: 1, vietnamese_meaning: 'sân bay', example_sentence: 'We arrived at the airport early.' },
      { word: 'passport', ipa: '/ˈpɑːs.pɔːt/', part_of_speech: 'n', cefr_level: 'A2', cefr_order: 2, vietnamese_meaning: 'hộ chiếu', example_sentence: 'Show your passport at check-in.' },
      { word: 'luggage', ipa: '/ˈlʌɡ.ɪdʒ/', part_of_speech: 'n', cefr_level: 'B1', cefr_order: 3, vietnamese_meaning: 'hành lý', example_sentence: 'My luggage was lost.' },
      { word: 'flight', ipa: '/flaɪt/', part_of_speech: 'n', cefr_level: 'A2', cefr_order: 4, vietnamese_meaning: 'chuyến bay', example_sentence: 'Our flight was delayed.' },
      { word: 'boarding pass', ipa: '/ˈbɔː.dɪŋ pɑːs/', part_of_speech: 'n', cefr_level: 'B1', cefr_order: 5, vietnamese_meaning: 'thẻ lên máy bay', example_sentence: 'Have your boarding pass ready.' },
      { word: 'customs', ipa: '/ˈkʌs.təmz/', part_of_speech: 'n', cefr_level: 'B1', cefr_order: 6, vietnamese_meaning: 'hải quan', example_sentence: 'We went through customs quickly.' },
      { word: 'departure', ipa: '/dɪˈpɑː.tʃər/', part_of_speech: 'n', cefr_level: 'B1', cefr_order: 7, vietnamese_meaning: 'khởi hành', example_sentence: 'Departure is at gate 12.' },
      { word: 'arrival', ipa: '/əˈraɪ.vəl/', part_of_speech: 'n', cefr_level: 'B1', cefr_order: 8, vietnamese_meaning: 'đến nơi', example_sentence: 'The arrival time is 3 PM.' },
      { word: 'security', ipa: '/sɪˈkjʊə.rə.ti/', part_of_speech: 'n', cefr_level: 'B1', cefr_order: 9, vietnamese_meaning: 'an ninh', example_sentence: 'Go through security screening.' },
      { word: 'check-in', ipa: '/ˈtʃek ɪn/', part_of_speech: 'n', cefr_level: 'A2', cefr_order: 10, vietnamese_meaning: 'làm thủ tục', example_sentence: 'Online check-in saves time.' },
    ],
  },
  {
    name: 'Restaurant',
    emoji: '🍽️',
    description: 'Từ vựng nhà hàng và ẩm thực',
    cefr_level: 'A2',
    words: [
      { word: 'restaurant', ipa: '/ˈres.tər.ɒnt/', part_of_speech: 'n', cefr_level: 'A2', cefr_order: 1, vietnamese_meaning: 'nhà hàng', example_sentence: 'We booked a table at the restaurant.' },
      { word: 'menu', ipa: '/ˈmen.juː/', part_of_speech: 'n', cefr_level: 'A1', cefr_order: 2, vietnamese_meaning: 'thực đơn', example_sentence: 'Can I see the menu, please?' },
      { word: 'waiter', ipa: '/ˈweɪ.tər/', part_of_speech: 'n', cefr_level: 'A2', cefr_order: 3, vietnamese_meaning: 'bồi bàn', example_sentence: 'The waiter took our order.' },
      { word: 'bill', ipa: '/bɪl/', part_of_speech: 'n', cefr_level: 'A2', cefr_order: 4, vietnamese_meaning: 'hóa đơn', example_sentence: 'Could we have the bill, please?' },
      { word: 'reservation', ipa: '/ˌrez.əˈveɪ.ʃən/', part_of_speech: 'n', cefr_level: 'B1', cefr_order: 5, vietnamese_meaning: 'đặt bàn', example_sentence: 'I made a reservation for two.' },
      { word: 'appetizer', ipa: '/ˈæp.ɪ.taɪ.zər/', part_of_speech: 'n', cefr_level: 'B2', cefr_order: 6, vietnamese_meaning: 'khai vị', example_sentence: 'We ordered an appetizer.' },
      { word: 'dessert', ipa: '/dɪˈzɜːt/', part_of_speech: 'n', cefr_level: 'A2', cefr_order: 7, vietnamese_meaning: 'tráng miệng', example_sentence: 'What desserts do you have?' },
      { word: 'spicy', ipa: '/ˈspaɪ.si/', part_of_speech: 'adj', cefr_level: 'A2', cefr_order: 8, vietnamese_meaning: 'cay', example_sentence: 'This dish is too spicy for me.' },
      { word: 'delicious', ipa: '/dɪˈlɪʃ.əs/', part_of_speech: 'adj', cefr_level: 'A2', cefr_order: 9, vietnamese_meaning: 'ngon', example_sentence: 'The food was delicious.' },
      { word: 'tip', ipa: '/tɪp/', part_of_speech: 'n', cefr_level: 'B1', cefr_order: 10, vietnamese_meaning: 'tiền boa', example_sentence: 'We left a 15% tip.' },
    ],
  },
];

export function getBuiltinTopic(name: string): BuiltinTopic | undefined {
  return BUILTIN_TOPICS.find(
    (t) => t.name.toLowerCase() === name.toLowerCase()
  );
}
