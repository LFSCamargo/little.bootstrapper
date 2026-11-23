# Rule: mobile-anti-patterns

> React Native & Lynx mobile anti-patterns (applies to mobile apps consuming `packages/ui-mobile`).

- **Never render long lists with `.map()` inside `ScrollView`**: Always use virtualized lists (`FlashList` / `FlatList` / Lynx virtualized lists) with stable `keyExtractor` and memoized `renderItem`.
- **Keep the JS/UI thread free**: Never run heavy JSON parsing, crypto, or synchronous loops on the UI thread; offload to worklets/native modules or batch async work.
- **Avoid inline object/function allocations in hot lists**: Hoist styles (`StyleSheet.create`, NativeWind classes, UniStyles, or Tamagui tokens) and memoize callbacks to prevent bridge/reconciler churn.
- **Respect safe areas & keyboard insets**: Wrap screens with `SafeAreaView` / `useSafeAreaInsets` and `KeyboardAvoidingView` on both iOS and Android.
- **Clean up native subscriptions**: Always unsubscribe from AppState, NetInfo, Dimensions, BackHandler, and event emitters on unmount to prevent memory leaks.
- **Optimize media & bundle size**: Use properly sized cached images (`expo-image` / FastImage), lazy-load heavy screens, and avoid shipping Node polyfills in mobile bundles.
- **Centralize shared UI in `packages/ui-mobile`**: Never scatter duplicate cross-platform design tokens across app screens.
