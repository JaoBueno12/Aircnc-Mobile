import { z } from "zod";

export const bookSchema = z.object({
    dataReserva: z.date({ message: 'Data da reserva é obrigatória' })
        .refine((date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date >= today;
        }, {
            message: 'Data da reserva deve ser hoje ou no futuro'
        })
        .refine((date) => {
            const maxDate = new Date();
            maxDate.setMonth(maxDate.getMonth() + 3); // Máximo 3 meses no futuro
            return date <= maxDate;
        }, {
            message: 'Data da reserva não pode ser mais de 3 meses no futuro'
        })
});

export type BookSchema = z.infer<typeof bookSchema>;
