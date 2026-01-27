<script setup lang="ts">
import { formatDate } from "~/utils/format";

interface POBEntry {
  id?: string;
  date: string;
  crew_count: number;
  extra_count: number;
  total_count: number;
}

interface Props {
  location: {
    id: string;
    code: string;
    name: string;
  };
  period: {
    id: string;
    name: string;
    start_date: string | Date;
    end_date: string | Date;
    status: string;
  };
  entries: Map<string, POBEntry>;
  summary: {
    total_crew_count: number;
    total_extra_count: number;
    total_mandays: number;
    entries_count: number;
  };
  companyName?: string;
  reportTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  companyName: "Stock Management System",
  reportTitle: "Personnel On Board Report",
});

const sortedDates = computed(() => Array.from(props.entries.keys()).sort());

const formattedDateRange = computed(() => {
  const start = formatDate(props.period.start_date);
  const end = formatDate(props.period.end_date);
  return `${start} - ${end}`;
});

const signatureBlocks = [
  { label: "Operator Signature", showDate: true },
  { label: "Manager Signature", showDate: true },
  { label: "Client Signature", showDate: true },
];
</script>

<template>
  <section class="print-report print-only hidden print:block text-black bg-white">
    <header class="print-header text-center mb-6">
      <h1 class="text-xl font-bold">{{ companyName }}</h1>
      <h2 class="text-lg font-semibold mt-2">{{ reportTitle }}</h2>
      <div class="mt-4 text-sm space-y-1">
        <p>
          <strong>Location:</strong>
          {{ location.name }} ({{ location.code }})
        </p>
        <p>
          <strong>Period:</strong>
          {{ period.name }}
        </p>
        <p>
          <strong>Date Range:</strong>
          {{ formattedDateRange }}
        </p>
        <p class="mt-2 text-lg">
          <strong>Total Mandays:</strong>
          {{ summary.total_mandays.toLocaleString() }}
        </p>
      </div>
    </header>

    <table class="print-table w-full border-collapse text-sm">
      <thead>
        <tr class="border-b-2 border-black">
          <th class="py-2 text-left">Date</th>
          <th class="py-2 text-center">Mandays</th>
          <th class="py-2 text-center">Visitor Meals</th>
          <th class="py-2 text-center">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dateStr in sortedDates" :key="dateStr" class="border-b border-gray-300">
          <td class="py-1">{{ formatDate(dateStr) }}</td>
          <td class="py-1 text-center">{{ entries.get(dateStr)!.crew_count }}</td>
          <td class="py-1 text-center">{{ entries.get(dateStr)!.extra_count }}</td>
          <td class="py-1 text-center font-medium">{{ entries.get(dateStr)!.total_count }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="border-t-2 border-black font-bold">
          <td class="py-2 whitespace-nowrap">TOTAL</td>
          <td class="py-2 text-center">{{ summary.total_crew_count.toLocaleString() }}</td>
          <td class="py-2 text-center">{{ summary.total_extra_count.toLocaleString() }}</td>
          <td class="py-2 text-center">{{ summary.total_mandays.toLocaleString() }}</td>
        </tr>
      </tfoot>
    </table>

    <div class="print-signatures flex justify-between gap-8 mt-16">
      <div v-for="block in signatureBlocks" :key="block.label" class="flex-1 text-center">
        <p class="text-sm font-medium mb-12">{{ block.label }}</p>
        <div class="border-t border-black pt-4">
          <div v-if="block.showDate" class="mt-10 text-xs">
            <div class="flex items-center gap-2 w-full">
              <span class="whitespace-nowrap">Date:</span>
              <span class="flex-1 border-b border-black mt-1"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="print-footer mt-16 text-center text-xs text-gray-500">
      <p>Generated on {{ new Date().toLocaleDateString() }}</p>
    </footer>
  </section>
</template>
