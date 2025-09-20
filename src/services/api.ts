import axios from 'axios';

const api = axios.create({
    baseURL:'http://10.53.52.23:3335',
})

export default api;