"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: "rgba(0, 0, 0, 0.75)",
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: "ltb-tour-popover",
        nextBtnText: "Siguiente",
        prevBtnText: "Anterior",
        doneBtnText: "Empezar",
        progressText: "{{current}} de {{total}}",
        onDestroyStarted: () => {
          driverObj.destroy();
          onComplete();
        },
        steps: [
          {
            popover: {
              title: "Bienvenido a La Trading Box",
              description: "Te vamos a mostrar las secciones principales para que puedas empezar a trackear tus operaciones.",
            },
          },
          {
            element: "[data-tour='header-stats']",
            popover: {
              title: "Tu rendimiento",
              description: "Aca ves tu P&L total y capital actual en tiempo real. Se actualiza con cada trade que registres.",
              side: "bottom" as const,
            },
          },
          {
            element: "[data-tour='nav-links']",
            popover: {
              title: "Navegacion",
              description: "Desde aca podes moverte entre las distintas secciones de la app.",
              side: "bottom" as const,
            },
          },
          {
            element: "[data-tour='nav-cuentas']",
            popover: {
              title: "Cuentas",
              description: "Lo primero que vas a necesitar es crear una cuenta de trading. Aca podes configurar tu broker, capital inicial y objetivo.",
              side: "bottom" as const,
            },
          },
          {
            element: "[data-tour='nav-estrategias']",
            popover: {
              title: "Estrategias",
              description: "Defini tus estrategias de trading con checklists personalizados. Despues podes asociarlas a cada trade.",
              side: "bottom" as const,
            },
          },
          {
            element: "[data-tour='nav-trades']",
            popover: {
              title: "Trades",
              description: "Registra tus operaciones con todos los detalles: par, entrada, SL, TP, tamano. Podes asociar una estrategia directamente al crear el trade.",
              side: "bottom" as const,
            },
          },
          {
            element: "[data-tour='nav-calendario']",
            popover: {
              title: "Calendario",
              description: "Visualiza tu actividad por dia, lleva un diario de trading y trackea tu estado emocional.",
              side: "bottom" as const,
            },
          },
          {
            element: "[data-tour='nav-config']",
            popover: {
              title: "Configuracion",
              description: "Personaliza tu experiencia. Y si te gusta la app, desde aca podes apoyar el proyecto con una donacion.",
              side: "bottom" as const,
            },
          },
          {
            popover: {
              title: "Listo!",
              description: "Ya conoces lo basico. Empeza creando tu primera cuenta desde la seccion Cuentas. Exitos en tu operativa!",
            },
          },
        ],
      });

      driverObj.drive();
    }, 600);

    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <style jsx global>{`
      .ltb-tour-popover {
        background-color: #0e1015 !important;
        border: 1px solid #252833 !important;
        color: #d4d4d8 !important;
        border-radius: 12px !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
      }
      .ltb-tour-popover .driver-popover-title {
        color: #d4d4d8 !important;
        font-size: 15px !important;
        font-weight: 700 !important;
      }
      .ltb-tour-popover .driver-popover-description {
        color: #a1a1aa !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
      }
      .ltb-tour-popover .driver-popover-progress-text {
        color: #52525b !important;
        font-size: 11px !important;
      }
      .ltb-tour-popover .driver-popover-prev-btn {
        background-color: transparent !important;
        border: 1px solid #252833 !important;
        color: #71717a !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        padding: 6px 16px !important;
      }
      .ltb-tour-popover .driver-popover-prev-btn:hover {
        color: #d4d4d8 !important;
        border-color: #3f3f46 !important;
      }
      .ltb-tour-popover .driver-popover-next-btn,
      .ltb-tour-popover .driver-popover-close-btn-custom {
        background-color: #5eead4 !important;
        color: #08090c !important;
        border: none !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        padding: 6px 16px !important;
      }
      .ltb-tour-popover .driver-popover-next-btn:hover {
        filter: brightness(1.1) !important;
      }
      .ltb-tour-popover .driver-popover-arrow-side-bottom .driver-popover-arrow,
      .ltb-tour-popover .driver-popover-arrow-side-top .driver-popover-arrow,
      .ltb-tour-popover .driver-popover-arrow-side-left .driver-popover-arrow,
      .ltb-tour-popover .driver-popover-arrow-side-right .driver-popover-arrow {
        border-color: #252833 !important;
      }
      .ltb-tour-popover .driver-popover-close-btn {
        color: #52525b !important;
      }
      .ltb-tour-popover .driver-popover-close-btn:hover {
        color: #d4d4d8 !important;
      }
    `}</style>
  );
}
