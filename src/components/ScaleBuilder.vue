<script setup lang="ts">
import { computed, ref } from "vue";
import TuningTable from "@/components/TuningTable.vue";
import { debounce, autoKeyColors } from "@/utils";
import ScaleRule from "@/components/ScaleRule.vue";
import { APP_TITLE } from "@/constants";
import { sanitizeFilename, midiNoteNumberToName } from "@/utils";
import { exportFile, type ExporterKey } from "@/exporters";
import Modal from "@/components/ModalDialog.vue";
import ReaperExportModal from "@/components/modals/ReaperExport.vue";
import ShareUrlModal from "@/components/modals/ShareUrl.vue";
import EqualTemperamentModal from "@/components/modals/generation/EqualTemperament.vue";
import HarmonicSeriesModal from "@/components/modals/generation/HarmonicSeries.vue";
import MosModal from "@/components/modals/generation/MosScale.vue";
import ApproximateByHarmonicsModal from "@/components/modals/modification/ApproximateByHarmonics.vue";
import SubharmonicSeriesModal from "@/components/modals/generation/SubharmonicSeries.vue";
import EnumerateChordModal from "@/components/modals/generation/EnumerateChord.vue";
import CpsModal from "@/components/modals/generation/CombinationProductSet.vue";
import CrossPolytopeModal from "@/components/modals/generation/CrossPolytope.vue";
import LatticeModal from "@/components/modals/generation/SpanLattice.vue";
import EulerGenusModal from "@/components/modals/generation/EulerGenus.vue";
import DwarfModal from "@/components/modals/generation/DwarfScale.vue";
import RankTwoModal from "@/components/modals/generation/RankTwo.vue";
import RotateModal from "@/components/modals/modification/RotateScale.vue";
import SubsetModal from "@/components/modals/modification/TakeSubset.vue";
import StretchModal from "@/components/modals/modification/StretchScale.vue";
import RandomVarianceModal from "@/components/modals/modification/RandomVariance.vue";
import TemperModal from "@/components/modals/modification/TemperScale.vue";
import EqualizeModal from "@/components/modals/modification/EqualizeScale.vue";
import ConvertModal from "@/components/modals/modification/ConvertType.vue";
import OffsetModal from "@/components/modals/modification/MergeOffset.vue";
import ApproximateBySubharmonicsModal from "@/components/modals/modification/ApproximateBySubharmonics.vue";
import ApproximateByRatiosModal from "@/components/modals/modification/ApproximateByRatios.vue";
import { presets, presetsByGroup } from "@/presets";
import { importFile, type ImporterKey } from "@/importers";
import { mtof } from "xen-dev-utils";
import type { Scale } from "scale-workshop-core";

const props = defineProps<{
  scaleName: string;
  scaleLines: string[];
  baseMidiNote: number;
  keyColors: string[];

  scale: Scale;
  frequencies: number[];

  centsFractionDigits: number;
  decimalFractionDigits: number;
  newline: string;
}>();

const emit = defineEmits([
  "update:scaleName",
  "update:scaleLines",
  "update:scale",
  "update:baseFrequency",
  "update:baseMidiNote",
  "update:keyColors",
]);

const joinedLines = computed({
  get() {
    return props.scaleLines.join("\n");
  },
  set: debounce((newValue: string) =>
    emit("update:scaleLines", newValue.split("\n"))
  ),
});

const joinedKeyColors = computed({
  get() {
    return props.keyColors.join(" ");
  },
  set: debounce((newValue: string) =>
    emit("update:keyColors", newValue.split(" "))
  ),
});

const scaleName = computed({
  get: () => props.scaleName,
  set: (newValue: string) => emit("update:scaleName", newValue),
});

const baseFrequency = computed({
  get: () => props.scale.baseFrequency,
  set: debounce((newValue: number) => {
    if (
      typeof newValue === "number" &&
      !isNaN(newValue) &&
      isFinite(newValue)
    ) {
      emit("update:baseFrequency", newValue);
    }
  }),
});

const baseMidiNote = computed({
  get: () => props.baseMidiNote,
  set: debounce((newValue: number) => {
    if (typeof newValue === "number" && !isNaN(newValue)) {
      emit("update:baseMidiNote", newValue);
    }
  }),
});

const midiNoteNumber = ref<HTMLInputElement | null>(null);

function autoFrequency() {
  let baseMidiNote = props.baseMidiNote;
  if (midiNoteNumber.value !== null) {
    // Circumvent debouncing for this simple click
    baseMidiNote = parseInt(midiNoteNumber.value.value);
    if (isNaN(baseMidiNote)) {
      return;
    }
  }

  emit("update:baseFrequency", mtof(baseMidiNote));
}

function doExport(exporter: ExporterKey) {
  const params = {
    newline: props.newline,
    name: props.scaleName,
    scaleUrl: window.location.href,
    scale: props.scale,
    filename: sanitizeFilename(props.scaleName),
    baseMidiNote: props.baseMidiNote,
    description: props.scaleName,
    lines: props.scaleLines,
    appTitle: APP_TITLE,
    date: new Date(),
  };

  exportFile(exporter, params);
}

const showReaperExportModal = ref(false);
const showShareUrlModal = ref(false);
const shareUrlModal = ref<any>(null);

const presetGroups = presetsByGroup();
const presetSelect = ref<HTMLSelectElement | null>(null);
const showPresetModal = ref(false);
function selectPreset() {
  const preset = presets[presetSelect.value!.value];
  emit("update:scaleName", preset.name);
  emit("update:scaleLines", preset.lines);
  emit("update:baseFrequency", preset.baseFrequency);
  emit("update:baseMidiNote", preset.baseMidiNote);
  emit("update:keyColors", preset.keyColors);
}

const showEqualTemperamentModal = ref(false);
const showHarmonicSeriesModal = ref(false);
const showMosModal = ref(false);
const showSubharmonicSeriesModal = ref(false);
const showEnumerateChordModal = ref(false);
const showCpsModal = ref(false);
const showLatticeModal = ref(false);
const showEulerGenusModal = ref(false);
const showDwarfModal = ref(false);
const showRankTwoModal = ref(false);
const showCrossPolytopeModal = ref(false);

const showRotateModal = ref(false);
const showSubsetModal = ref(false);
const showStretchModal = ref(false);
const showRandomVarianceModal = ref(false);
const showApproximateByHarmonicsModal = ref(false);
const showApproximateBySubharmonicsModal = ref(false);
const showTemperModal = ref(false);
const showEqualizeModal = ref(false);
const showOffsetModal = ref(false);
const showConvertModal = ref(false);
const showApproximateByRatiosModal = ref(false);

const scaleDataArea = ref<HTMLTextAreaElement | null>(null);
const subsetModal = ref<any>(null);

const scalaFile = ref<HTMLInputElement | null>(null);
const anamarkFile = ref<HTMLInputElement | null>(null);

const exportTextClipboard = ref("Copy this scale's unique URL to clipboard");

async function doImport(importerKey: ImporterKey, event: Event) {
  const result = await importFile(importerKey, event);
  emit("update:scaleLines", result.scale.toStrings());
  if (result.name !== undefined) {
    emit("update:scaleName", result.name);
  }
  if (result.baseMidiNote !== undefined) {
    emit("update:baseMidiNote", result.baseMidiNote);
  }
}

function copyToClipboard() {
  window.navigator.clipboard.writeText(window.location.href);
  exportTextClipboard.value = "[Copied URL to clipboard]";
  window.setTimeout(() => {
    exportTextClipboard.value = "Copy this scale's unique URL to clipboard";
  }, 5000);
}
</script>

<template>
  <div id="tab-build-scale" class="columns-container">
    <div class="column scale-builder">
      <textarea
        id="scale-name"
        rows="1"
        placeholder="Untitled scale"
        v-model="scaleName"
      ></textarea>

      <ul class="btn-group">
        <li class="btn-dropdown-group">
          <a class="btn" href="#">New scale ▼</a>
          <ul>
            <a href="#" @click="showEqualTemperamentModal = true"
              ><li>Equal temperament</li></a
            >
            <a href="#" @click="showRankTwoModal = true"
              ><li>Rank-2 temperament</li></a
            >
            <a href="#" @click="showHarmonicSeriesModal = true"
              ><li>Harmonic series segment</li></a
            >
            <a href="#" @click="showSubharmonicSeriesModal = true"
              ><li>Subharmonic series segment</li></a
            >
            <a href="#" @click="showEnumerateChordModal = true"
              ><li>Enumerate chord</li></a
            >
            <a href="#" @click="showCpsModal = true"
              ><li>Combination product set</li></a
            >
            <a href="#" @click="showMosModal = true"
              ><li>Moment of symmetry scale</li></a
            >
            <a href="#" @click="showEulerGenusModal = true"
              ><li>Euler-Fokker genus</li></a
            >
            <a href="#" @click="showDwarfModal = true"><li>Dwarf scale</li></a>
            <a href="#" @click="showCrossPolytopeModal = true"
              ><li>Cross-polytope</li></a
            >
            <a href="#" @click="showLatticeModal = true"
              ><li>Span lattice</li></a
            >
            <li class="divider"></li>
            <a href="#" @click="scalaFile?.click()"><li>Import .scl</li></a>
            <a href="#" @click="anamarkFile?.click()"><li>Import .tun</li></a>
            <li class="divider"></li>
            <a
              href="#"
              @click="
                joinedLines = '';
                scaleDataArea!.focus();
              "
              ><li>Clear scale</li></a
            >
            <a href="#" @click="showPresetModal = true"
              ><li>Load preset scale</li></a
            >
          </ul>
        </li>
        <li class="btn-dropdown-group">
          <a class="btn" href="#">Modify scale ▼</a>
          <ul>
            <a
              href="#"
              @click="
                $emit('update:scale', scale.sorted());
                scaleDataArea!.focus();
              "
              ><li>Sort ascending</li></a
            >
            <a
              href="#"
              @click="
                $emit('update:scale', scale.reduce());
                scaleDataArea!.focus();
              "
              ><li>Reduce</li></a
            >
            <a
              href="#"
              @click="
                $emit('update:scale', scale.invert());
                scaleDataArea!.focus();
              "
              ><li>Invert</li></a
            >
            <a href="#" @click="showRotateModal = true"><li>Rotate</li></a>
            <a
              href="#"
              @click="
                subsetModal.initialize();
                showSubsetModal = true;
              "
              ><li>Subset</li></a
            >
            <a href="#" @click="showStretchModal = true"
              ><li>Stretch/compress</li></a
            >
            <a href="#" @click="showRandomVarianceModal = true"
              ><li>Random variance</li></a
            >
            <a href="#" @click="showApproximateByRatiosModal = true"
              ><li>Approximate by ratios</li></a
            >
            <a href="#" @click="showApproximateByHarmonicsModal = true"
              ><li>Approximate by harmonics</li></a
            >
            <a href="#" @click="showApproximateBySubharmonicsModal = true"
              ><li>Approximate by subharmonics</li></a
            >
            <a href="#" @click="showEqualizeModal = true"><li>Equalize</li></a>
            <a href="#" @click="showTemperModal = true"><li>Temper</li></a>
            <a href="#" @click="showOffsetModal = true"
              ><li>Merge offset</li></a
            >
            <a href="#" @click="showConvertModal = true"
              ><li>Convert interval values</li></a
            >
          </ul>
        </li>
      </ul>

      <div class="control-group">
        <h2>Scale data</h2>
        <div class="control">
          <textarea
            ref="scaleDataArea"
            rows="12"
            v-model="joinedLines"
          ></textarea>
        </div>
      </div>

      <ScaleRule :scale="props.scale" />

      <div class="control-group">
        <h2>Tuning</h2>

        <div class="control">
          <label>Base frequency</label>
          <input
            class="real-valued"
            type="number"
            min="0.1"
            step="0.1"
            max="1000000"
            v-model="baseFrequency"
          />
          <button @click="autoFrequency">Auto</button>
          <span>Hz</span>
        </div>

        <div class="control">
          <label>MIDI note for base frequency</label>
          <input
            type="number"
            ref="midiNoteNumber"
            min="0"
            max="127"
            step="1"
            v-model="baseMidiNote"
          />
          <span>{{ midiNoteNumberToName(baseMidiNote) }}</span>
        </div>

        <!-- This control is for the 3rd field that is found at the top of kbm files -->
        <!--<div class="control">
          <label>MIDI note for 1/1</label>
          <input
            class="real-valued"
            type="number"
            min="0"
            step="1"
            max="127"
          />
          <span>A5</span>
        </div>-->
      </div>

      <div class="control-group">
        <h2>Key colors</h2>
        <div class="control">
          <p>
            A list of key colors, ascending from 1/1. Key colors are cosmetic
            only; they do not affect mapping.
          </p>
          <textarea v-model="joinedKeyColors"></textarea>
        </div>
        <div class="control">
          <button
            @click="$emit('update:keyColors', autoKeyColors(props.scale.size))"
          >
            Auto
          </button>
        </div>
      </div>
    </div>
    <TuningTable
      :scale="scale"
      :frequencies="frequencies"
      :lines="props.scaleLines"
      :baseMidiNote="props.baseMidiNote"
      :keyColors="props.keyColors"
    />
    <div class="column exporters">
      <h2>Export current settings</h2>
      <a href="#" class="btn" @click="copyToClipboard">
        <p><strong>Share scale</strong></p>
        <p>{{ exportTextClipboard }}</p>
      </a>
      <a href="#" class="btn" @click="doExport('anamarkv1')">
        <p><strong>AnaMark v1 tuning (.tun)</strong></p>
        <p>Tuning file for various synths</p>
      </a>
      <a href="#" class="btn" @click="doExport('anamarkv2')">
        <p><strong>AnaMark v2 tuning (.tun)</strong></p>
        <p>Tuning file for various synths</p>
      </a>
      <a href="#" class="btn" @click="doExport('scalascl')">
        <p><strong>Scala scale (.scl)</strong></p>
        <p>
          Scale file for various synths.<br />If you use this file without an
          accompanying .kbm file, most synths will assume your scale starts on C
          ~261Hz
        </p>
      </a>
      <a href="#" class="btn" @click="doExport('scalakbm')">
        <p><strong>Scala keyboard mapping (.kbm)</strong></p>
        <p>
          Maps an accompanying .scl file to start on a specific MIDI note and
          frequency
        </p>
      </a>
      <a href="#" class="btn" @click="doExport('maxmsp')">
        <p><strong>Max/MSP coll tuning (.txt)</strong></p>
        <p>
          List of frequencies (Hz) in a text file to load into a Max/MSP coll
          object
        </p>
      </a>
      <a href="#" class="btn" @click="doExport('puredata')">
        <p><strong>PureData text tuning (.txt)</strong></p>
        <p>
          List of frequencies (Hz) in a text file to load into a PureData text
          object
        </p>
      </a>
      <a href="#" class="btn" @click="doExport('kontakt')">
        <p><strong>Kontakt tuning script (.txt)</strong></p>
        <p>
          Tuning script for Native Instruments Kontakt. Some instrument
          libraries allow this custom script
        </p>
      </a>
      <a href="#" class="btn" @click="doExport('soniccouture')">
        <p><strong>Soniccouture tuning file (.nka)</strong></p>
        <p>For Soniccouture sample libraries</p>
      </a>
      <a href="#" class="btn" @click="doExport('harmor')">
        <p><strong>Harmor pitch map (.fnv)</strong></p>
        <p>Envelope state file for the pitch envelope in Image-Line Harmor</p>
      </a>
      <a href="#" class="btn" @click="doExport('sytrus')">
        <p><strong>Sytrus pitch map (.fnv)</strong></p>
        <p>Envelope state file for the pitch envelope in Image-Line Sytrus</p>
      </a>
      <a href="#" class="btn" @click="doExport('mnlgtuns')">
        <p><strong>Korg 'logue user scale (.mnlgtuns)</strong></p>
        <p>Single scale for Korg 'logue Sound Librarian.</p>
        <p>Full tuning of all MIDI notes</p>
      </a>
      <a href="#" class="btn" @click="doExport('mnlgtuno')">
        <p><strong>Korg 'logue user octave (.mnlgtuno)</strong></p>
        <p>Single scale for Korg 'logue Sound Librarian.</p>
        <p>Only supports octave-repeating scales with 12 intervals</p>
      </a>
      <a href="#" class="btn" @click="doExport('deflemask')">
        <p><strong>Deflemask reference (.txt)</strong></p>
        <p>List of 'fine tune' values for Deflemask</p>
      </a>
      <a href="#" class="btn" @click="showReaperExportModal = true">
        <p><strong>Reaper note name map (.txt)</strong></p>
        <p>Displays custom note names on Reaper's piano roll</p>
      </a>
      <a
        href="#"
        class="btn"
        @click="
          showShareUrlModal = true;
          shareUrlModal.initialize();
        "
      >
        <p><strong>Share scale (email etc.)</strong></p>
        <p>Conveniently share this scale's unique URL</p>
      </a>
    </div>
  </div>

  <!-- Hidden file inputs for importers -->
  <input
    type="file"
    ref="scalaFile"
    accept=".scl"
    style="display: none"
    @change="doImport('scalascl', $event)"
  />
  <input
    type="file"
    ref="anamarkFile"
    accept=".tun"
    style="display: none"
    @change="doImport('anamark', $event)"
  />

  <Teleport to="body">
    <ReaperExportModal
      :show="showReaperExportModal"
      @confirm="showReaperExportModal = false"
      @cancel="showReaperExportModal = false"
      :newline="props.newline"
      :scaleName="scaleName"
      :baseMidiNote="baseMidiNote"
      :scale="scale"
    />

    <RankTwoModal
      :show="showRankTwoModal"
      :centsFractionDigits="centsFractionDigits"
      :scale="scale"
      @update:scaleName="emit('update:scaleName', $event)"
      @update:scale="
        showRankTwoModal = false;
        emit('update:scale', $event);
      "
      @update:keyColors="emit('update:keyColors', $event)"
      @cancel="showRankTwoModal = false"
    />

    <ShareUrlModal
      ref="shareUrlModal"
      :show="showShareUrlModal"
      :scaleName="scaleName"
      :newline="newline"
      @confirm="showShareUrlModal = false"
      @cancel="showShareUrlModal = false"
    />

    <EqualTemperamentModal
      :show="showEqualTemperamentModal"
      @update:scaleName="emit('update:scaleName', $event)"
      @update:scale="
        showEqualTemperamentModal = false;
        emit('update:scale', $event);
      "
      @cancel="showEqualTemperamentModal = false"
    />

    <HarmonicSeriesModal
      :show="showHarmonicSeriesModal"
      @update:scaleName="emit('update:scaleName', $event)"
      @update:scale="
        showHarmonicSeriesModal = false;
        emit('update:scale', $event);
      "
      @cancel="showHarmonicSeriesModal = false"
    />

    <MosModal
      :show="showMosModal"
      @update:scaleName="emit('update:scaleName', $event)"
      @update:scale="
        showMosModal = false;
        emit('update:scale', $event);
      "
      @update:keyColors="emit('update:keyColors', $event)"
      @cancel="showMosModal = false"
    />

    <SubharmonicSeriesModal
      :show="showSubharmonicSeriesModal"
      @update:scaleName="emit('update:scaleName', $event)"
      @update:scale="
        showSubharmonicSeriesModal = false;
        emit('update:scale', $event);
      "
      @cancel="showSubharmonicSeriesModal = false"
    />

    <EnumerateChordModal
      :show="showEnumerateChordModal"
      @update:scaleName="emit('update:scaleName', $event)"
      @update:scale="
        showEnumerateChordModal = false;
        emit('update:scale', $event);
      "
      @cancel="showEnumerateChordModal = false"
    />

    <CpsModal
      :show="showCpsModal"
      @update:scaleName="emit('update:scaleName', $event)"
      @update:scale="
        showCpsModal = false;
        emit('update:scale', $event);
      "
      @cancel="showCpsModal = false"
    />

    <EulerGenusModal
      :show="showEulerGenusModal"
      @update:scaleName="emit('update:scaleName', $event)"
      @update:scale="
        showEulerGenusModal = false;
        emit('update:scale', $event);
      "
      @cancel="showEulerGenusModal = false"
    />

    <DwarfModal
      :show="showDwarfModal"
      @update:scaleName="emit('update:scaleName', $event)"
      @update:scale="
        showDwarfModal = false;
        emit('update:scale', $event);
      "
      @cancel="showDwarfModal = false"
    />

    <CrossPolytopeModal
      :show="showCrossPolytopeModal"
      @update:scaleName="emit('update:scaleName', $event)"
      @update:scale="
        showCrossPolytopeModal = false;
        emit('update:scale', $event);
      "
      @cancel="showCrossPolytopeModal = false"
    />
    <LatticeModal
      :show="showLatticeModal"
      :centsFractionDigits="centsFractionDigits"
      @update:scaleName="emit('update:scaleName', $event)"
      @update:scale="
        showLatticeModal = false;
        emit('update:scale', $event);
      "
      @cancel="showLatticeModal = false"
    />

    <Modal
      :show="showPresetModal"
      @confirm="
        showPresetModal = false;
        selectPreset();
      "
      @cancel="showPresetModal = false"
    >
      <template #header>
        <h2>Load preset scale</h2>
      </template>
      <template #body>
        <div class="control-group">
          <div class="control">
            <select ref="presetSelect" size="10" class="control">
              <optgroup
                v-for="group of presetGroups"
                :key="group.name"
                :label="group.name"
              >
                <option
                  v-for="preset of group.members"
                  :key="preset.id"
                  :value="preset.id"
                >
                  {{ preset.title }}
                </option>
              </optgroup>
            </select>
          </div>
        </div>
      </template>
    </Modal>

    <RotateModal
      :show="showRotateModal"
      @update:scale="
        showRotateModal = false;
        emit('update:scale', $event);
      "
      @cancel="showRotateModal = false"
      :scale="scale"
    />

    <SubsetModal
      ref="subsetModal"
      :show="showSubsetModal"
      @update:scale="
        showSubsetModal = false;
        emit('update:scale', $event);
      "
      @cancel="showSubsetModal = false"
      :scale="scale"
    />

    <StretchModal
      :show="showStretchModal"
      @update:scale="
        showStretchModal = false;
        emit('update:scale', $event);
      "
      @cancel="showStretchModal = false"
      :scale="scale"
      :centsFractionDigits="centsFractionDigits"
      :decimalFractionDigits="decimalFractionDigits"
    />

    <RandomVarianceModal
      :show="showRandomVarianceModal"
      @update:scale="
        showRandomVarianceModal = false;
        emit('update:scale', $event);
      "
      @cancel="showRandomVarianceModal = false"
      :scale="scale"
      :centsFractionDigits="centsFractionDigits"
      :decimalFractionDigits="decimalFractionDigits"
    />

    <ApproximateByRatiosModal
      :show="showApproximateByRatiosModal"
      @update:scale="emit('update:scale', $event)"
      @cancel="showApproximateByRatiosModal = false"
      :scale="scale"
    />

    <ApproximateByHarmonicsModal
      :show="showApproximateByHarmonicsModal"
      @update:scale="
        showApproximateByHarmonicsModal = false;
        emit('update:scale', $event);
      "
      @cancel="showApproximateByHarmonicsModal = false"
      :scale="scale"
    />

    <ApproximateBySubharmonicsModal
      :show="showApproximateBySubharmonicsModal"
      @update:scale="
        showApproximateBySubharmonicsModal = false;
        emit('update:scale', $event);
      "
      @cancel="showApproximateBySubharmonicsModal = false"
      :scale="scale"
    />

    <EqualizeModal
      :show="showEqualizeModal"
      @update:scale="
        showEqualizeModal = false;
        emit('update:scale', $event);
      "
      @cancel="showEqualizeModal = false"
      :scale="scale"
    />

    <TemperModal
      :show="showTemperModal"
      @update:scale="
        showTemperModal = false;
        emit('update:scale', $event);
      "
      @cancel="showTemperModal = false"
      :scale="scale"
      :centsFractionDigits="centsFractionDigits"
    />

    <OffsetModal
      :show="showOffsetModal"
      @update:scale="
        showOffsetModal = false;
        emit('update:scale', $event);
      "
      @cancel="showOffsetModal = false"
      :scale="scale"
    />

    <ConvertModal
      :show="showConvertModal"
      @update:scale="
        showConvertModal = false;
        emit('update:scale', $event);
      "
      @cancel="showConvertModal = false"
      :scale="scale"
      :centsFractionDigits="centsFractionDigits"
      :decimalFractionDigits="decimalFractionDigits"
    />
  </Teleport>
</template>

<style scoped>
/* Content layout (small) */
div.columns-container {
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-border);
}
div.column {
  background-color: var(--color-background);
  overflow-x: hidden;
}
div.scale-builder {
  padding: 1rem;
}
div.tuning-table {
  padding: 0rem;
}
div.exporters {
  padding: 1rem;
}

/* Content layout (medium) */
@media screen and (min-width: 600px) {
  div.columns-container {
    column-count: 2;
    column-gap: 1px;
    overflow: hidden;
  }
  div.column {
    overflow-y: auto;
  }
  div.scale-builder {
    width: 100%;
    height: 100%;
  }
  div.tuning-table {
    width: 100%;
    height: 66%;
  }
  div.exporters {
    width: 100%;
    height: 34%;
    border-top: 1px solid var(--color-border);
  }
}

/* Content layout (large) */
@media screen and (min-width: 1100px) {
  div.columns-container {
    column-count: 3;
  }
  div.column {
    height: 100%;
  }
  div.exporters {
    border: none;
  }
}

/* UI elements */
#scale-name {
  width: 100%;
  font-size: 1.4em;
  margin-bottom: 1rem;
  padding: 0.3rem;
  font-family: sans-serif;
  resize: vertical;
}
div.exporters .btn {
  width: 100%;
  display: block;
  margin-bottom: 1rem;
  margin-left: 0;
}

select optgroup + optgroup {
  margin-top: 1em;
}

.real-valued:invalid {
  background-color: var(--color-background);
}
</style>
