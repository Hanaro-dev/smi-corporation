<script setup>
function iconName(theme) {
  if (theme === "system") return "i-lucide-laptop";
  if (theme === "light") return "i-lucide-sun";
  if (theme === "dark") return "i-lucide-moon";
}
</script>

<template>
  <div>
    <ul>
      <li
        v-for="theme of ['system', 'light', 'dark']"
        :key="theme"
        :class="{
          'preferred': $colorMode.preference === theme,
          'selected': $colorMode.value === theme
        }"
        class=""
      >
        <UIcon
          :name="iconName(theme)"
          class="size-6"
          @click="$colorMode.preference = theme"
        />
      </li>
    </ul>
    <!--     <p>
      <ColorScheme placeholder="..." tag="span">
        Preference: <b>{{ $colorMode.preference }}</b>
        <span v-if="$colorMode.preference === 'system'"
          >&nbsp;(<i>{{ $colorMode.value }}</i> mode detected)</span
        >
        <span v-if="$colorMode.forced"
          >&nbsp;(<i>{{ $colorMode.value }}</i> forced)</span
        >
      </ColorScheme>
    </p> -->
  </div>
</template>

<style scoped>
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
ul li {
  display: inline-block;
  padding: 3px;
  line-height: 0;
}
p {
  margin: 0;
  padding-top: 5px;
  padding-bottom: 20px;
}
li {
  position: relative;
  top: 0px;
  cursor: pointer;
  padding: 7px;
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-color);
  margin: 0;
  border-radius: 5px;
  transition: all 0.1s ease;
}
li:hover {
  top: -3px;
}
li.preferred {
  border-color: var(--color-primary);
  top: -4px;
}
li.selected {
  color: var(--color-primary);
}
</style>
