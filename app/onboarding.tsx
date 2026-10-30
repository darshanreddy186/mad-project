import { useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Wrench, MapPin, Star, ShieldCheck } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/Button';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: 1,
    image:
      'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg',
    icon: 'Wrench',
    title: 'Discover Modification Shops',
    subtitle:
      'Browse hundreds of car modification specialists near you — from performance tuning to custom paint and bodywork.',
  },
  {
    id: 2,
    image:
      'https://images.pexels.com/photos/2096523/pexels-photo-2096523.jpeg',
    icon: 'MapPin',
    title: 'Find Shops Nearby',
    subtitle:
      'Use your location to discover the best-rated modification shops around you, with real-time distance and directions.',
  },
  {
    id: 3,
    image:
      'https://images.pexels.com/photos/3786091/pexels-photo-3786091.jpeg',
    icon: 'Star',
    title: 'Reviews & Ratings',
    subtitle:
      'Read honest customer reviews and see real before-and-after portfolio photos before you choose a shop.',
  },
  {
    id: 4,
    image:
      'https://images.pexels.com/photos/2533092/pexels-photo-2533092.jpeg',
    icon: 'ShieldCheck',
    title: 'Book with Confidence',
    subtitle:
      'Request quotes, book appointments and message shops directly. Verified shops for trusted service every time.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  const onScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const currentSlide = ONBOARDING_SLIDES[activeIndex];

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        className="flex-1">
        {ONBOARDING_SLIDES.map((slide) => (
          <View key={slide.id} style={{ width }} className="flex-1">
            <View className="relative h-[55%] w-full">
              <Image
                source={{ uri: slide.image }}
                className="h-full w-full"
                resizeMode="cover"
              />
              <View
                className="absolute inset-0"
                style={{
                  backgroundColor: 'rgba(15,17,21,0.5)',
                }}
              />
            </View>
            <View className="flex-1 items-center px-8 pt-8">
              <Text
                className="mb-4 text-center text-2xl font-bold text-white"
                style={{ lineHeight: 32 }}>
                {slide.title}
              </Text>
              <Text
                className="text-center text-base"
                style={{ color: Colors.charcoal[300], lineHeight: 24 }}>
                {slide.subtitle}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="items-center pb-2">
        <View className="mb-6 flex-row gap-2">
          {ONBOARDING_SLIDES.map((_, i) => (
            <View
              key={i}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === activeIndex ? 24 : 8,
                backgroundColor:
                  i === activeIndex ? Colors.accent[500] : Colors.charcoal[600],
              }}
            />
          ))}
        </View>
      </View>

      <View className="px-6 pb-10">
        <View className="flex-row items-center justify-between gap-4">
          <Pressable onPress={handleSkip}>
            <Text
              className="text-sm font-medium"
              style={{ color: Colors.charcoal[400] }}>
              Skip
            </Text>
          </Pressable>
          <View className="flex-1">
            <Button
              label={activeIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
              onPress={handleNext}
              fullWidth
              size="lg"
            />
          </View>
        </View>
      </View>
    </View>
  );
}
