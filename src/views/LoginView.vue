<template>
    <div class="hero bg-base-200 min-h-screen">
        <div class="hero-content flex-col lg:flex-row-reverse">
            <div class="text-center lg:text-left">
                <h1 class="text-5xl font-bold">{{ t('login.title') }}</h1>
                <p class="py-6">
                    {{ t('login.subtitle') }}
                </p>
            </div>
            <div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
                <form class="card-body" @submit.prevent="handleLogin">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">{{ t('login.username') }}</span>
                        </label>
                        <input
                            v-model="username"
                            type="text"
                            placeholder="kele23"
                            class="input input-bordered"
                            required
                        />
                    </div>
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">{{ t('login.password') }}</span>
                        </label>
                        <input
                            v-model="password"
                            type="password"
                            :placeholder="t('login.password')"
                            class="input input-bordered"
                            required
                        />
                    </div>
                    <div v-if="errorMsg" class="text-error text-sm mt-2">
                        {{ errorMsg }}
                    </div>
                    <div class="form-control mt-6">
                        <button
                            type="submit"
                            class="btn btn-primary"
                            :disabled="loading"
                        >
                            <span
                                v-if="loading"
                                class="loading loading-spinner"
                            ></span>
                            {{ t('login.submit') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.ts';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

async function handleLogin() {
    errorMsg.value = '';
    loading.value = true;
    const success = await auth.login(username.value, password.value);
    loading.value = false;

    if (success) {
        router.push('/');
    } else {
        errorMsg.value = t('login.invalidCredentials');
    }
}
</script>
