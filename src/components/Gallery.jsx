import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const Gallery = () => {
    const images = [
        '/images/hero.png', // Fallback to hero for now
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1520606262248-841f586af8ee?auto=format&fit=crop&q=80'
    ];

    return (
        <section className="py-20 bg-secondary/5">
            <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl text-primary font-heading">Nuestra Historia</h2>
                <p className="text-gray-500 mt-2">Un pequeño vistazo a nuestros mejores momentos</p>
            </div>

            <div className="max-w-4xl mx-auto px-4">
                <Swiper
                    modules={[Navigation, Pagination, Autoplay, EffectFade]}
                    spaceBetween={30}
                    slidesPerView={1}
                    effect="fade"
                    navigation
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                    className="rounded-2xl shadow-2xl aspect-[3/2] md:aspect-[16/9]"
                >
                    {images.map((src, index) => (
                        <SwiperSlide key={index}>
                            <img
                                src={src}
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
};

export default Gallery;
