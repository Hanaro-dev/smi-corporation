/**
 * Performance Indexes Migration
 * Adds database indexes for improved query performance
 */

export async function up(queryInterface, Sequelize) {
  console.log('Adding performance indexes...');
  
  try {
    // User table indexes
    await queryInterface.addIndex('Users', ['email'], {
      name: 'idx_users_email',
      unique: true
    });
    
    await queryInterface.addIndex('Users', ['username'], {
      name: 'idx_users_username',
      unique: true
    });
    
    await queryInterface.addIndex('Users', ['role_id'], {
      name: 'idx_users_role_id'
    });

    // Page table indexes
    await queryInterface.addIndex('Pages', ['slug'], {
      name: 'idx_pages_slug',
      unique: true
    });
    
    await queryInterface.addIndex('Pages', ['status'], {
      name: 'idx_pages_status'
    });
    
    await queryInterface.addIndex('Pages', ['parentId'], {
      name: 'idx_pages_parent_id'
    });
    
    await queryInterface.addIndex('Pages', ['level'], {
      name: 'idx_pages_level'
    });
    
    await queryInterface.addIndex('Pages', ['createdAt'], {
      name: 'idx_pages_created_at'
    });

    // Image table indexes
    await queryInterface.addIndex('Images', ['userId'], {
      name: 'idx_images_user_id'
    });
    
    await queryInterface.addIndex('Images', ['filename'], {
      name: 'idx_images_filename',
      unique: true
    });
    
    await queryInterface.addIndex('Images', ['hash'], {
      name: 'idx_images_hash'
    });
    
    await queryInterface.addIndex('Images', ['createdAt'], {
      name: 'idx_images_created_at'
    });

    // ImageVariant table indexes
    await queryInterface.addIndex('ImageVariants', ['imageId'], {
      name: 'idx_image_variants_image_id'
    });
    
    await queryInterface.addIndex('ImageVariants', ['type'], {
      name: 'idx_image_variants_type'
    });

    // Role-Permission junction table indexes
    await queryInterface.addIndex('RolePermissions', ['roleId'], {
      name: 'idx_role_permissions_role_id'
    });
    
    await queryInterface.addIndex('RolePermissions', ['permissionId'], {
      name: 'idx_role_permissions_permission_id'
    });

    // Composite indexes for common query patterns
    await queryInterface.addIndex('Pages', ['status', 'level'], {
      name: 'idx_pages_status_level'
    });
    
    await queryInterface.addIndex('Pages', ['parentId', 'order'], {
      name: 'idx_pages_parent_order'
    });
    
    await queryInterface.addIndex('Images', ['userId', 'createdAt'], {
      name: 'idx_images_user_date'
    });

    console.log('✅ Performance indexes added successfully');
  } catch (error) {
    console.error('❌ Error adding performance indexes:', error);
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  console.log('Removing performance indexes...');
  
  try {
    // Remove indexes in reverse order
    const indexesToRemove = [
      'idx_users_email',
      'idx_users_username', 
      'idx_users_role_id',
      'idx_pages_slug',
      'idx_pages_status',
      'idx_pages_parent_id',
      'idx_pages_level',
      'idx_pages_created_at',
      'idx_images_user_id',
      'idx_images_filename',
      'idx_images_hash',
      'idx_images_created_at',
      'idx_image_variants_image_id',
      'idx_image_variants_type',
      'idx_role_permissions_role_id',
      'idx_role_permissions_permission_id',
      'idx_pages_status_level',
      'idx_pages_parent_order',
      'idx_images_user_date'
    ];

    for (const indexName of indexesToRemove) {
      try {
        await queryInterface.removeIndex('Users', indexName);
      } catch (e) {
        // Index might not exist or might be on different table
        try {
          await queryInterface.removeIndex('Pages', indexName);
        } catch (e2) {
          try {
            await queryInterface.removeIndex('Images', indexName);
          } catch (e3) {
            try {
              await queryInterface.removeIndex('ImageVariants', indexName);
            } catch (e4) {
              try {
                await queryInterface.removeIndex('RolePermissions', indexName);
              } catch (e5) {
                console.warn(`Could not remove index ${indexName}:`, e5.message);
              }
            }
          }
        }
      }
    }

    console.log('✅ Performance indexes removed successfully');
  } catch (error) {
    console.error('❌ Error removing performance indexes:', error);
    throw error;
  }
}