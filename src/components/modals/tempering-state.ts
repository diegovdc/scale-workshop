// Component state used by RankOne, RankTwo and TemperScale

import { computedAndError } from "@/utils";
import { fractionToString } from "scale-workshop-core";
import { Subgroup, type TuningOptions } from "temperaments";
import { computed, ref, watch, type Ref } from "vue";

// Split text values separated by whitespace, pipes, amps, semicolons or commas.
export function splitText(text: string) {
  return text
    .replace(/\s/g, ",")
    .replace(/\|/g, ",")
    .replace(/&/g, ",")
    .replace(/;/g, ",")
    .split(",")
    .filter((token) => token.length);
}

export function makeState(method: Ref, subgroupStringDefault = "") {
  // === Component state ===
  // method: "vals"
  const valsString = ref("");
  // medhod: "commas"
  const commasString = ref("");
  // Generic
  const subgroupString = ref(subgroupStringDefault);
  // Advanced
  const weightsString = ref("");
  const tempering = ref<"TE" | "POTE" | "CTE">("CTE");
  const constraintsString = ref("");

  // === Computed state ===
  const vals = computed(() => splitText(valsString.value));

  const commas = computed(() => splitText(commasString.value));

  const subgroupDefault = new Subgroup(subgroupStringDefault || []);
  const [subgroup, subgroupError] = computedAndError(() => {
    const value = subgroupString.value.trim();

    if (!value.length) {
      if (method.value === "commas") {
        return Subgroup.inferPrimeSubgroup(commas.value);
      }
      return new Subgroup([]);
    }

    if (value.includes(".")) {
      return new Subgroup(value);
    }
    return new Subgroup(parseInt(value));
  }, subgroupDefault);

  const weights = computed(() => {
    const value = splitText(weightsString.value).map((weight) =>
      parseFloat(weight)
    );
    if (value.length) {
      return value;
    }
    return undefined;
  });

  const constraints = computed(() => splitText(constraintsString.value));

  const options = computed<TuningOptions>(() => {
    if (tempering.value === "CTE") {
      return {
        temperEquaves: true,
        constraints: constraints.value,
        weights: weights.value,
      };
    } else if (tempering.value === "TE") {
      return {
        temperEquaves: true,
        weights: weights.value,
      };
    } else {
      return { weights: weights.value };
    }
  });

  // === Watchers ===
  // Enforce CTE pure equaves unless the user interferes
  watch(subgroup, (newValue, oldValue) => {
    if (
      !constraintsString.value.length ||
      (oldValue.basis.length &&
        constraintsString.value === fractionToString(oldValue.basis[0]))
    ) {
      if (!newValue.basis.length) {
        constraintsString.value = "";
      } else {
        constraintsString.value = fractionToString(newValue.basis[0]);
      }
    }
  });

  return {
    valsString,
    commasString,
    subgroupString,
    subgroupError,
    weightsString,
    tempering,
    constraintsString,
    vals,
    commas,
    subgroup,
    weights,
    options,
  };
}
