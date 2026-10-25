import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Project } from '../../types.ts';
import { PROJECT_TRANSLATION_KEYS } from '../../constants.tsx';

export const useTranslatedProject = (project: Project): Project => {
  const { t } = useTranslation('projects');

  return useMemo(() => {
    const translationKey = PROJECT_TRANSLATION_KEYS[project.slug];

    if (!translationKey) {
      // Return original project if no translation key found
      return project;
    }

    // Get translations for this project
    const getProjectTranslation = (
      field: string,
      fallback: string | undefined,
    ): string | undefined => {
      const translated = t(`projects.${translationKey}.${field}`, { defaultValue: '' });
      return translated && translated !== `projects.${translationKey}.${field}`
        ? translated
        : fallback;
    };

    // Get translated metrics array
    const getMetrics = (): string[] | undefined => {
      const metrics = t(`projects.${translationKey}.metrics`, { returnObjects: true });
      if (Array.isArray(metrics)) {
        const strings = metrics.filter((m): m is string => typeof m === 'string');
        if (strings.length === metrics.length) return strings;
      }
      return project.metrics;
    };

    // Get translated features
    const getFeatures = () => {
      if (!project.features) return undefined;

      const featuresData = t(`projects.${translationKey}.features`, { returnObjects: true }) as
        Record<string, { title: string; description: string }> | undefined;

      if (typeof featuresData !== 'object' || featuresData === null) {
        return project.features;
      }

      // Map feature keys to translated content while preserving icons
      const featureKeys = Object.keys(featuresData);
      return project.features.map((feature, index) => {
        const key = featureKeys[index];
        const translatedFeature = key ? featuresData[key] : null;

        return {
          ...feature,
          title: translatedFeature?.title || feature.title,
          description: translatedFeature?.description || feature.description,
        };
      });
    };

    // Get translated results
    const getResults = () => {
      if (!project.results) return undefined;

      const resultsData = t(`projects.${translationKey}.results`, { returnObjects: true }) as
        Record<string, { metric: string; value: string; description: string }> | undefined;

      if (typeof resultsData !== 'object' || resultsData === null) {
        return project.results;
      }

      const resultKeys = Object.keys(resultsData);
      return project.results.map((result, index) => {
        const key = resultKeys[index];
        const translatedResult = key ? resultsData[key] : null;

        return {
          ...result,
          metric: translatedResult?.metric || result.metric,
          value: translatedResult?.value || result.value,
          description: translatedResult?.description || result.description,
        };
      });
    };

    return {
      ...project,
      // Keep original title for technical/brand names
      title: getProjectTranslation('title', project.title) || project.title,
      role: getProjectTranslation('role', project.role),
      team: getProjectTranslation('team', project.team),
      duration: getProjectTranslation('duration', project.duration),
      description: getProjectTranslation('description', project.description) || project.description,
      detailedDescription: getProjectTranslation(
        'detailedDescription',
        project.detailedDescription,
      ),
      challenge: getProjectTranslation('challenge', project.challenge),
      solution: getProjectTranslation('solution', project.solution),
      metrics: getMetrics(),
      features: getFeatures(),
      results: getResults(),
    };
  }, [project, t]);
};

// Hook to translate an array of projects
export const useTranslatedProjects = (projects: Project[]): Project[] => {
  const { t } = useTranslation('projects');

  return useMemo(() => {
    return projects.map((project) => {
      const translationKey = PROJECT_TRANSLATION_KEYS[project.slug];

      if (!translationKey) {
        return project;
      }

      const getProjectTranslation = (
        field: string,
        fallback: string | undefined,
      ): string | undefined => {
        const translated = t(`projects.${translationKey}.${field}`, { defaultValue: '' });
        return translated && translated !== `projects.${translationKey}.${field}`
          ? translated
          : fallback;
      };

      const getMetrics = (): string[] | undefined => {
        const metrics = t(`projects.${translationKey}.metrics`, { returnObjects: true });
        if (Array.isArray(metrics)) {
          const strings = metrics.filter((m): m is string => typeof m === 'string');
          if (strings.length === metrics.length) return strings;
        }
        return project.metrics;
      };

      const getFeatures = () => {
        if (!project.features) return undefined;

        const featuresData = t(`projects.${translationKey}.features`, { returnObjects: true }) as
          Record<string, { title: string; description: string }> | undefined;

        if (typeof featuresData !== 'object' || featuresData === null) {
          return project.features;
        }

        const featureKeys = Object.keys(featuresData);
        return project.features.map((feature, index) => {
          const key = featureKeys[index];
          const translatedFeature = key ? featuresData[key] : null;

          return {
            ...feature,
            title: translatedFeature?.title || feature.title,
            description: translatedFeature?.description || feature.description,
          };
        });
      };

      const getResults = () => {
        if (!project.results) return undefined;

        const resultsData = t(`projects.${translationKey}.results`, { returnObjects: true }) as
          Record<string, { metric: string; value: string; description: string }> | undefined;

        if (typeof resultsData !== 'object' || resultsData === null) {
          return project.results;
        }

        const resultKeys = Object.keys(resultsData);
        return project.results.map((result, index) => {
          const key = resultKeys[index];
          const translatedResult = key ? resultsData[key] : null;

          return {
            ...result,
            metric: translatedResult?.metric || result.metric,
            value: translatedResult?.value || result.value,
            description: translatedResult?.description || result.description,
          };
        });
      };

      return {
        ...project,
        title: getProjectTranslation('title', project.title) || project.title,
        role: getProjectTranslation('role', project.role),
        team: getProjectTranslation('team', project.team),
        duration: getProjectTranslation('duration', project.duration),
        description:
          getProjectTranslation('description', project.description) || project.description,
        detailedDescription: getProjectTranslation(
          'detailedDescription',
          project.detailedDescription,
        ),
        challenge: getProjectTranslation('challenge', project.challenge),
        solution: getProjectTranslation('solution', project.solution),
        metrics: getMetrics(),
        features: getFeatures(),
        results: getResults(),
      };
    });
  }, [projects, t]);
};
