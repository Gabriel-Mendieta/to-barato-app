import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    StyleSheet,
    Modal,
    Pressable,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MotiView } from 'moti';

// Datos de ejemplo
const profileData = {
    name: 'Mario Luciano',
    phone: '809-123-4567',
    email: 'mario.luciano@gmail.com',
    imageUrl: 'https://picsum.photos/seed/MarioLuciano/200/200',
};

const profileOptions = [
    { id: '1', text: 'Editar perfil', icon: 'settings-outline', screen: 'EditProfile' },
    { id: '2', text: 'Preferencias', icon: 'star-outline', screen: 'Preferences' },
    { id: '3', text: 'Cerrar Sesión', icon: 'log-out-outline', action: 'logout' },
];

const notificationsData = [
    { id: 'n1', title: 'Ofertas y Promociones', desc: 'El arroz que buscabas está a RD$50 menos en Supermercado X.', time: 'Hace 4 horas', icon: 'info-outline' },
    { id: 'n2', title: 'Recordatorio de Lista de Compras', desc: 'No olvides tu lista de compras para hoy.', time: 'Hace 1 día', icon: 'shopping-cart' },
    { id: 'n3', title: 'Actualización de Precios', desc: 'El precio de la leche en Farmacia Z ha bajado un 15%. ¡Consulta más ofertas similares en la app!', time: 'Hace 12 días', icon: 'attach-money' },
];

const ProfileScreen: React.FC = () => {
    const [showNotifications, setShowNotifications] = useState(false);

    const handleOptionPress = (item: any) => {
        if (item.action === 'logout') {
            router.replace('/auth/IniciarSesion');
        } else if (item.screen) {
            router.push(`/settings/${item.screen}`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#001D35" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image source={require('../../../assets/icons/logo.png')} style={styles.logo} />
                    <Text style={styles.headerText}>To' Barato</Text>
                </View>
                <TouchableOpacity onPress={() => setShowNotifications(true)}>
                    <Ionicons name="notifications-outline" size={26} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Notifications Modal */}
            <Modal
                visible={showNotifications}
                animationType="slide"
                transparent
                onRequestClose={() => setShowNotifications(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notificaciones</Text>
                            <Pressable onPress={() => setShowNotifications(false)}>
                                <Ionicons name="close" size={24} color="#555" />
                            </Pressable>
                        </View>
                        <ScrollView>
                            {notificationsData.map(notif => (
                                <View key={notif.id} style={styles.notifCard}>
                                    <View style={styles.notifLeft}>
                                        <MaterialIcons name={notif.icon} size={24} color="#EDCA04" />
                                        <View style={styles.notifTextContainer}>
                                            <Text style={styles.notifTitle}>{notif.title}</Text>
                                            <Text style={styles.notifDesc}>{notif.desc}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.notifTime}>{notif.time}</Text>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowNotifications(false)}>
                            <Text style={styles.closeButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Info */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    style={styles.profileHeader}
                >
                    <Text style={styles.title}>Perfil</Text>
                    <Image source={{ uri: profileData.imageUrl }} style={styles.avatar} />
                    <Text style={styles.name}>{profileData.name}</Text>
                    <Text style={styles.contact}>{profileData.phone}</Text>
                    <Text style={styles.contact}>{profileData.email}</Text>
                </MotiView>

                {/* Options List */}
                <View style={styles.optionsContainer}>
                    {profileOptions.map(item => (
                        <TouchableOpacity key={item.id} style={styles.optionItem} onPress={() => handleOptionPress(item)}>
                            <View style={styles.optionLeft}>
                                <Ionicons name={item.icon} size={22} color="#4B5563" />
                                <Text style={styles.optionText}>{item.text}</Text>
                            </View>
                            <MaterialIcons name="keyboard-arrow-right" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FF' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#001D35', paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
        paddingBottom: 12,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    logo: { width: 32, height: 48, marginRight: 8 },
    headerText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
    scrollContent: { paddingBottom: 20 },
    profileHeader: { alignItems: 'center', paddingVertical: 24 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#101418', marginBottom: 12 },
    avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 4, borderColor: '#FFF', marginBottom: 16, backgroundColor: '#eee' },
    name: { fontSize: 20, fontWeight: '600', color: '#101418' },
    contact: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    optionsContainer: { paddingHorizontal: 16, marginTop: 16 },
    optionItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 16,
        borderRadius: 8, marginBottom: 12, elevation: 2,
    },
    optionLeft: { flexDirection: 'row', alignItems: 'center' },
    optionText: { fontSize: 16, color: '#101418', marginLeft: 12 },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 12, padding: 20, maxHeight: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
    notifCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 12, elevation: 2 },
    notifLeft: { flexDirection: 'row', alignItems: 'flex-start' },
    notifTextContainer: { flex: 1, marginLeft: 8 },
    notifTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    notifDesc: { fontSize: 14, color: '#555' },
    notifTime: { fontSize: 12, color: '#999', marginTop: 8, textAlign: 'right' },
    closeButton: { marginTop: 16, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#001D35', borderRadius: 8 },
    closeButtonText: { color: '#FFF', fontWeight: '600' },
});
