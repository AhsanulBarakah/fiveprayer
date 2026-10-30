module.exports = function removeEmptyTypesPlugin() {
  return {
    visitor: {
      TSTypeAliasDeclaration(path) {
        const { id, typeAnnotation } = path.node;
        if (
          id?.name === 'Props' &&
          typeAnnotation?.type === 'TSTypeLiteral' &&
          Array.isArray(typeAnnotation.members) &&
          typeAnnotation.members.length === 0
        ) {
          path.remove();
        }
      },
    },
  };
};
