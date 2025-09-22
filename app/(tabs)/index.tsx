import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useCardsStore } from '@store/cardsStore';
import { FearCard } from '@components/FearCard';
import { EmptyState } from '@components/EmptyState';
import { LoadingState } from '@components/LoadingState';
import { FearCard as FearCardType } from '@types/models';

const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const {
    cards,
    isLoading: storeLoading,
    loadCards,
    getActiveCards
  } = useCardsStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const activeCards = getActiveCards();

  useEffect(() => {
    if (isFocused) {
      loadCards(false); // загружаем только активные карточки
    }
  }, [isFocused, loadCards]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadCards(false);
    setIsRefreshing(false);
  }, [loadCards]);

  const handleCreatePress = useCallback(() => {
    navigation.navigate('create' as never);
  }, [navigation]);

  const renderCard = ({ item }: { item: FearCardType }) => (
    <FearCard card={item} />
  );

  const keyExtractor = (item: FearCardType) => item.id;

  if (storeLoading && activeCards.length === 0) {
    return <LoadingState />;
  }

  if (!activeCards.length) {
    return (
      <>
        <EmptyState onCreatePress={handleCreatePress} />
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
          onPress={handleCreatePress}
          color={theme.colors.onPrimaryContainer}
        />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activeCards}
        renderItem={renderCard}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        onPress={handleCreatePress}
        color={theme.colors.onPrimaryContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
});

export default HomeScreen;