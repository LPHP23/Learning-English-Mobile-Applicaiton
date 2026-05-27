import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type TopicIconStyle = {
  name: IconName;
  bg: string;
  color: string;
};

const TOPIC_ICON_MAP: Record<string, TopicIconStyle> = {
  Hospital: { name: 'hospital-box-outline', bg: '#1F2937', color: '#E5E7EB' },
  Airport: { name: 'airplane', bg: '#1E293B', color: '#BAE6FD' },
  Restaurant: { name: 'silverware-fork-knife', bg: '#2A1E1E', color: '#FECACA' },
  Office: { name: 'briefcase-outline', bg: '#1F2937', color: '#FCD34D' },
  Shopping: { name: 'shopping-outline', bg: '#1F2A24', color: '#86EFAC' },
  Technology: { name: 'laptop', bg: '#1E293B', color: '#93C5FD' },
  Nature: { name: 'leaf', bg: '#1F2A24', color: '#86EFAC' },
  Sports: { name: 'soccer', bg: '#1F2937', color: '#FDE68A' },
  Travel: { name: 'compass-outline', bg: '#1E293B', color: '#A5B4FC' },
  Food: { name: 'food-variant', bg: '#2A1E1E', color: '#FDBA74' },
  Health: { name: 'heart-pulse', bg: '#2A1E1E', color: '#FCA5A5' },
  Business: { name: 'chart-line', bg: '#1E293B', color: '#A5B4FC' },
  Education: { name: 'school-outline', bg: '#1F2937', color: '#FDE68A' },
  Music: { name: 'music-note', bg: '#1E293B', color: '#C4B5FD' },
  Art: { name: 'palette-outline', bg: '#2A1E1E', color: '#F9A8D4' },
  Science: { name: 'flask-outline', bg: '#1F2937', color: '#93C5FD' },
};

const TOPIC_IMAGE_MAP: Record<string, ImageSourcePropType> = {
  airport: require('../assets/topic_emoji/Airport.png'),
  art: require('../assets/topic_emoji/Art.png'),
  business: require('../assets/topic_emoji/Business.png'),
  education: require('../assets/topic_emoji/Education.png'),
  food: require('../assets/topic_emoji/Food.png'),
  health: require('../assets/topic_emoji/Health.png'),
  hospital: require('../assets/topic_emoji/Hospital.png'),
  music: require('../assets/topic_emoji/Music.png'),
  nature: require('../assets/topic_emoji/Nature.png'),
  office: require('../assets/topic_emoji/Office.png'),
  restaurant: require('../assets/topic_emoji/Restaurant.png'),
  science: require('../assets/topic_emoji/Science.png'),
  shopping: require('../assets/topic_emoji/Shopping.png'),
  sports: require('../assets/topic_emoji/Sports.png'),
  technology: require('../assets/topic_emoji/Technology.png'),
  travel: require('../assets/topic_emoji/Travel.png'),
};

const DEFAULT_ICON: TopicIconStyle = {
  name: 'bookmark-outline',
  bg: '#1F2937',
  color: '#E5E7EB',
};

type TopicIconProps = {
  topicName: string;
  size?: number;
  imageSource?: ImageSourcePropType | null;
  imageUri?: string | null;
};

export default function TopicIcon({
  topicName,
  size = 22,
  imageSource,
  imageUri,
}: TopicIconProps) {
  const frameSize = size + 12;
  const normalizedName = topicName.trim().toLowerCase();
  const localSource = TOPIC_IMAGE_MAP[normalizedName];
  const source = imageSource ?? localSource ?? (imageUri ? { uri: imageUri } : null);

  if (source) {
    const imageSize = size + 6;
    return (
      <View
        style={[
          styles.imageWrap,
          { width: frameSize, height: frameSize, borderRadius: frameSize / 2 },
        ]}
      >
        <Image
          source={source}
          style={{ width: imageSize, height: imageSize, borderRadius: imageSize / 2 }}
          resizeMode="cover"
        />
      </View>
    );
  }

  const icon = TOPIC_ICON_MAP[topicName] ?? DEFAULT_ICON;

  return (
    <View
      style={[
        styles.iconWrap,
        {
          width: frameSize,
          height: frameSize,
          borderRadius: frameSize / 2,
          backgroundColor: icon.bg,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon.name} size={size} color={icon.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
});
