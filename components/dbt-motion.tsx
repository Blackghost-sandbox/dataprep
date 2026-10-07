"use client";
import {useKafkaMotion} from "@/components/kafka-motion";
// Use the established presentation engine; dbt simulations retain their own execution state.
export function useDbtMotion(nodes:string){return useKafkaMotion({nodes,theme:"dbt"});}
