// app/tabs/list/iaResult.tsx
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function IaResultScreen() {
    const { reply } = useLocalSearchParams<{ reply: string }>();
    const router = useRouter();
    const raw = decodeURIComponent(reply || '');

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>ToBarato recomienda:</Text>
                <Markdown
                    style={{
                        body: styles.message,
                        strong: styles.bold,
                    }}
                >
                    {raw}
                </Markdown>
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.push('../../tabs/lista')}>
                <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FF' },
    content: { padding: 16 },
    title: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: '#101418' },
    message: { fontSize: 16, color: '#555', lineHeight: 22 },
    bold: { fontWeight: '600' },
    closeBtn: { backgroundColor: '#001D35', padding: 14, alignItems: 'center' },
    closeText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
