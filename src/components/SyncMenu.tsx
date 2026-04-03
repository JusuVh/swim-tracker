import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../i18n';
import { syncPull, syncPush } from '../services/storage';
import { colors } from '../theme/colors';
import { globalStyles } from '../theme/styles';

interface SyncMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export default function SyncMenu({ isVisible, onClose, onSyncComplete }: SyncMenuProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncPush = async () => {
    setIsSyncing(true);
    try {
      await syncPush();
      Alert.alert(t('common.success' as any) || 'Succès', 'Données envoyées sur le cloud !');
      onSyncComplete?.();
    } catch (e) {
      console.error(e);
      Alert.alert(t('common.error' as any) || 'Erreur', 'Impossible d’envoyer les données.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncPull = async () => {
    Alert.alert(
      'Récupérer les données',
      'Cela va remplacer vos données locales par celles du cloud. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Récupérer',
          onPress: async () => {
            setIsSyncing(true);
            try {
              await syncPull();
              Alert.alert(t('common.success' as any) || 'Succès', 'Données récupérées !');
              onSyncComplete?.();
              onClose();
            } catch (e) {
              console.error(e);
              Alert.alert(t('common.error' as any) || 'Erreur', 'Impossible de récupérer les données.');
            } finally {
              setIsSyncing(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <View style={[globalStyles.card, styles.menuCard]}>
            <Text style={[globalStyles.text__caption, styles.menuTitle]}>
              <FontAwesome name="cloud" size={14} /> SYNCHRONISATION
            </Text>

            <TouchableOpacity
              style={[globalStyles.button, styles.syncButton]}
              onPress={handleSyncPush}
              disabled={isSyncing}
            >
              <View style={styles.buttonContent}>
                <FontAwesome name="upload" size={14} color={colors.primary} />
                <Text style={[globalStyles.button__text, styles.buttonText]}>
                  {isSyncing ? '...' : 'Envoyer vers Cloud'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.button, styles.syncButton]}
              onPress={handleSyncPull}
              disabled={isSyncing}
            >
              <View style={styles.buttonContent}>
                <FontAwesome name="download" size={14} color={colors.primary} />
                <Text style={[globalStyles.button__text, styles.buttonText]}>
                  {isSyncing ? '...' : 'Récupérer du Cloud'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Partage familial sans login</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 60, // Adjust based on header height
    right: 16,
    width: 230,
  },
  menuCard: {
    padding: 16,
    backgroundColor: colors.surface,
    elevation: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  syncButton: {
    backgroundColor: colors.surfaceHighlight,
    marginBottom: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
  }
});
