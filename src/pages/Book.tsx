import { useState } from "react";
import { 
    StyleSheet, 
    Alert, 
    SafeAreaView, 
    Image, 
    Text, 
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootStackParamList } from "../routes";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import logo from '../assets/logo.png';
import api from '../services/api';
import { bookSchema } from '../config/schemas';

// 📌 Inferir tipo a partir do schema do Zod
type BookFormData = z.infer<typeof bookSchema>;

type BookRouteProp = RouteProp<RootStackParamList, 'Book'>
type BookScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Book'>

export function Book(){
    const navigation = useNavigation<BookScreenNavigationProp>();
    const route = useRoute<BookRouteProp>();
    const { id } = route.params; // id do spot (da sala pra reserva)
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch
    } = useForm<BookFormData>({
        resolver: zodResolver(bookSchema),
        defaultValues: {
            dataReserva: new Date()
        }
    });

    const selectedDate = watch('dataReserva');

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setValue('dataReserva', selectedDate);
        }
    };

    const showDatePickerModal = () => {
        setShowDatePicker(true);
    };

    
    async function onSubmit(data: BookFormData){
        setIsLoading(true);
        try {
            const user_id = await AsyncStorage.getItem('user') ?? '';

            if (!user_id) {
                Alert.alert('Erro', 'Usuário não encontrado. Faça login novamente.');
                navigation.navigate('Login');
                return;
            }

            // Formatar a data corretamente
            const dataFormatada = data.dataReserva.toLocaleDateString('pt-BR');
            const dataISO = data.dataReserva.toISOString().split('T')[0]; // YYYY-MM-DD
            
            console.log('Enviando reserva para data:', dataFormatada);

            await api.post(
                `/bookings/${id}/spots`,
                { 
                    date: dataISO
                },
                { headers: { user_id } }
            );

            Alert.alert(
                'Sucesso!', 
                `Reserva solicitada para ${dataFormatada}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            reset({
                                dataReserva: new Date()
                            });
                            navigation.navigate('List');
                        }
                    }
                ]
            );
        } catch (error: any) {
            console.error('Erro ao enviar reserva:', error);
            
            let errorMessage = 'Não foi possível enviar a solicitação. Tente novamente.';
            
            if (error.response?.status === 400) {
                errorMessage = 'Dados inválidos. Verifique a data e tente novamente.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Sessão expirada. Faça login novamente.';
                navigation.navigate('Login');
                return;
            } else if (error.response?.status === 409) {
                errorMessage = 'Você já possui uma reserva para este spot nesta data.';
            }
            
            Alert.alert('Erro', errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    function handleCancel(){
        navigation.navigate('List');
    }

    return(
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Image style={styles.logo} source={logo}/>
                
                <Text style={styles.title}>Solicitar Reserva</Text>
                <Text style={styles.subtitle}>Selecione a data para sua reserva</Text>
                
                <Text style={styles.label}>DATA DA RESERVA *</Text>
                <TouchableOpacity 
                    style={[styles.dateButton, errors.dataReserva && styles.inputError]}
                    onPress={showDatePickerModal}
                    disabled={isLoading}
                >
                    <Text style={[styles.dateButtonText, errors.dataReserva && styles.errorText]}>
                        {formatDate(selectedDate)}
                    </Text>
                    <Text style={styles.dateButtonIcon}>📅</Text>
                </TouchableOpacity>
                {errors.dataReserva && (
                    <Text style={styles.errorText}>{errors.dataReserva.message}</Text>
                )}

                <TouchableOpacity 
                    onPress={handleSubmit(onSubmit)} 
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    disabled={isLoading || isSubmitting}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.buttonText}>Solicitar reserva</Text>
                    )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={handleCancel} 
                    style={[styles.button, styles.cancelButton]}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                        minimumDate={new Date()}
                        maximumDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)} // 3 meses no futuro
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 40,
    },
    logo:{
        height: 32,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    label:{
        fontWeight: 'bold',
        color: '#444',
        marginBottom: 8,
        fontSize: 16,
    },
    input:{
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#444',
        height: 50,
        marginBottom: 20,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    inputError:{
        borderColor: '#e74c3c',
        borderWidth: 2,
    },
    errorText:{
        color: '#e74c3c',
        fontSize: 14,
        marginBottom: 10,
        marginTop: -10,
        fontWeight: '500',
    },
    button:{
        height: 50,
        backgroundColor: '#f05a5b',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
    buttonText:{
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton:{
        backgroundColor: '#6c757d',
        marginTop: 0,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 20,
        height: 50,
        marginBottom: 20,
        borderRadius: 8,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateButtonText: {
        fontSize: 16,
        color: '#444',
    },
    dateButtonIcon: {
        fontSize: 20,
    }
});
