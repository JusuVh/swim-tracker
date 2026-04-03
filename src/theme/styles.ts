import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const globalStyles = StyleSheet.create({
  // --- Layout BEM ---
  page: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  'page--centered': {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // --- Typography BEM ---
  text__heading1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  text__heading2: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  text__body: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  text__caption: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // --- Buttons BEM ---
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  'button--secondary': {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  'button--md': {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  'button--sm': {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  'button--xs': {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  button__text: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  'button__text--secondary': {
    color: colors.primary,
  },
  
  // --- Cards BEM ---
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  // Modifier for data-displaying cards (times, swimmers, competitions)
  'card--data': {
    borderWidth: 1,
    borderColor: colors.border,
  },
  card__title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  
  // --- Inputs BEM ---
  input: {
    backgroundColor: colors.surfaceHighlight,
    color: colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
